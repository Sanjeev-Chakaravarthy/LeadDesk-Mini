import { Hono } from "hono";
import { handle } from "hono/vercel";
import { auth } from "@/utils/auth.server";
import { prisma } from "@/utils/db.server";
import { sendInviteEmail, sendNewLeadNotificationEmail } from "@/utils/email";

const app = new Hono().basePath("/api");

// Global Hono error handler to ensure JSON is always returned for API errors
app.onError((err, c) => {
  console.error("[api/error]", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

// Context helper to securely resolve organization workspace context from Better Auth session
async function getSessionContext(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session || !session.user) {
    return null;
  }
  
  // Find organization membership for this user
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (!membership) {
    return null;
  }

  return {
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    userId: session.user.id,
    userName: session.user.name,
    role: membership.role,
  };
}

// Debug endpoint
app.get("/debug-config", (c) => {
  return c.json({
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "NOT SET",
    VERCEL_URL: process.env.VERCEL_URL || "NOT SET",
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL || "NOT SET",
    google_redirect_uri: `${process.env.BETTER_AUTH_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : `https://${process.env.VERCEL_URL}`)}/api/auth/callback/google`,
  });
});

// Organization & Account Registration API
app.post("/register", async (c) => {
  const { fullName, email, orgName, password, inviteOrg } = await c.req.json();
  const isInvited = !!inviteOrg;

  if (!email || !password || !fullName) {
    return c.json({ error: "All fields are required" }, 400);
  }
  if (!isInvited && !orgName) {
    return c.json({ error: "Agency name is required" }, 400);
  }

  try {
    const userSession = await auth.api.signUpEmail({
      body: { email, password, name: fullName },
    });

    if (!userSession || !userSession.user) {
      return c.json({ error: "Failed to create account." }, 400);
    }

    if (isInvited) {
      const inviteIdentifier = `invite:${inviteOrg}:${email}`;
      const invite = await prisma.verification.findFirst({
        where: { identifier: inviteIdentifier, value: inviteOrg, expiresAt: { gt: new Date() } },
      });

      if (invite) {
        const existing = await prisma.membership.findFirst({
          where: { organizationId: inviteOrg, userId: userSession.user.id },
        });
        if (!existing) {
          await prisma.membership.create({
            data: { organizationId: inviteOrg, userId: userSession.user.id, role: "Member" },
          });
          await prisma.auditLog.create({
            data: { organizationId: inviteOrg, userId: userSession.user.id, eventName: "Member Joined", details: email },
          });
        }
        await prisma.verification.delete({ where: { id: invite.id } });
      }

      return c.json({ success: true });
    }

    const organization = await prisma.organization.create({ data: { name: orgName } });

    await prisma.membership.create({
      data: { organizationId: organization.id, userId: userSession.user.id, role: "Owner" },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: userSession.user.id,
        eventName: "Workspace Created",
        details: orgName,
      },
    });

    return c.json({ success: true });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Agency workspace creation failed. Email may already be registered.";
    return c.json({ error: errorMsg }, 400);
  }
});

// 1. Capture Lead API (Supports both authenticated users & public landing page submission)
app.post("/leads", async (c) => {
  const body = await c.req.json();
  const { name, email, budget, message, source, company, phone } = body;

  if (!name || !email || !message) {
    return c.json({ error: "Name, email, and message are required." }, 400);
  }

  // Try resolving session context if available
  const context = await getSessionContext(c.req.raw.headers);

  let targetOrgId: string;
  let creatorUserId: string | null = null;

  if (context) {
    targetOrgId = context.organizationId;
    creatorUserId = context.userId;
  } else {
    // Public submission (e.g. from landing page inquiry form)
    // Find the first default organization or create a demo workspace
    const firstOrg = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
    if (firstOrg) {
      targetOrgId = firstOrg.id;
    } else {
      const demoOrg = await prisma.organization.create({ data: { name: "Apex Creative Agency" } });
      targetOrgId = demoOrg.id;
    }
  }

  const lead = await prisma.lead.create({
    data: {
      organizationId: targetOrgId,
      name,
      email,
      budget: budget || "$5,000 - $10,000",
      message,
      status: "New",
      source: source || "Website Form",
      company: company || null,
      phone: phone || null,
    },
  });

  // Log activity
  const firstUser = creatorUserId
    ? null
    : await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

  await prisma.auditLog.create({
    data: {
      organizationId: targetOrgId,
      userId: creatorUserId || firstUser?.id || "system",
      eventName: "Lead Captured",
      details: `${name} (${company || email}) — ${budget || "$5k-$10k"}`,
    },
  });

  // Send email notification to workspace owner/members asynchronously
  const orgWithMembers = await prisma.organization.findUnique({
    where: { id: targetOrgId },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (orgWithMembers && orgWithMembers.members.length > 0) {
    const recipientEmails = orgWithMembers.members
      .map((m) => m.user.email)
      .filter(Boolean);

    for (const recipientEmail of recipientEmails) {
      sendNewLeadNotificationEmail({
        toEmail: recipientEmail,
        leadName: name,
        leadEmail: email,
        company,
        budget: budget || "$5,000 - $10,000",
        message,
        source: source || "Website Form",
        workspaceName: orgWithMembers.name,
      }).catch((err) => {
        console.error("[email/lead] Failed to send lead notification email:", err.message);
      });
    }
  }

  return c.json({ lead, success: true });
});

// 2. Fetch Leads (Workspace Scoped with Search, Filtering, Pagination)
app.get("/leads", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const search = c.req.query("search") || "";
  const status = c.req.query("status") || "";
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const cursor = c.req.query("cursor");

  const leads = await prisma.lead.findMany({
    where: {
      organizationId: context.organizationId,
      AND: [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
            { message: { contains: search, mode: "insensitive" } },
          ],
        },
        status ? { status: { equals: status } } : {},
      ],
    },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: "desc" },
  });

  let nextCursor: typeof cursor | undefined = undefined;
  if (leads.length > limit) {
    const nextItem = leads.pop();
    nextCursor = nextItem!.id;
  }

  return c.json({ leads, nextCursor });
});

// 3. Analytics & Lead Statistics API (Must be declared before /leads/:id to prevent wildcard parameter matching)
app.get("/leads/analytics", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const orgId = context.organizationId;

  const [totalLeads, newLeads, contactedLeads, closedLeads, leadsList] = await Promise.all([
    prisma.lead.count({ where: { organizationId: orgId } }),
    prisma.lead.count({ where: { organizationId: orgId, status: "New" } }),
    prisma.lead.count({ where: { organizationId: orgId, status: "Contacted" } }),
    prisma.lead.count({ where: { organizationId: orgId, status: "Closed" } }),
    prisma.lead.findMany({ where: { organizationId: orgId }, select: { source: true, budget: true, createdAt: true } }),
  ]);

  const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

  // Source Distribution
  const sourcesMap: Record<string, number> = {};
  leadsList.forEach((l) => {
    const src = l.source || "Website Form";
    sourcesMap[src] = (sourcesMap[src] || 0) + 1;
  });

  const sources = Object.entries(sourcesMap).map(([name, count]) => ({
    name,
    count,
    percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
  }));

  return c.json({
    totalLeads,
    newLeads,
    contactedLeads,
    closedLeads,
    conversionRate,
    sources,
  });
});

// CSV Export Endpoint
app.get("/leads/export", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const leads = await prisma.lead.findMany({
    where: { organizationId: context.organizationId },
    orderBy: { createdAt: "desc" },
  });

  const header = "ID,Name,Email,Company,Phone,Budget,Status,Source,Created At\n";
  const rows = leads
    .map((l) =>
      [
        l.id,
        `"${(l.name || "").replace(/"/g, '""')}"`,
        `"${(l.email || "").replace(/"/g, '""')}"`,
        `"${(l.company || "").replace(/"/g, '""')}"`,
        `"${(l.phone || "").replace(/"/g, '""')}"`,
        `"${(l.budget || "").replace(/"/g, '""')}"`,
        l.status,
        `"${(l.source || "").replace(/"/g, '""')}"`,
        new Date(l.createdAt).toISOString(),
      ].join(",")
    )
    .join("\n");

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="leaddesk_mini_leads_${Date.now()}.csv"`);
  return c.body(header + rows);
});

// Bulk Status Update Endpoint
app.post("/leads/bulk-status", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { ids, status } = await c.req.json();
  if (!Array.isArray(ids) || !status) {
    return c.json({ error: "ids array and status are required." }, 400);
  }

  await prisma.lead.updateMany({
    where: {
      id: { in: ids },
      organizationId: context.organizationId,
    },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: context.organizationId,
      userId: context.userId,
      eventName: "Bulk Status Updated",
      details: `Updated ${ids.length} leads to ${status}`,
    },
  });

  return c.json({ success: true, count: ids.length });
});

// Bulk Delete Endpoint
app.post("/leads/bulk-delete", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { ids } = await c.req.json();
  if (!Array.isArray(ids)) {
    return c.json({ error: "ids array is required." }, 400);
  }

  await prisma.lead.deleteMany({
    where: {
      id: { in: ids },
      organizationId: context.organizationId,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: context.organizationId,
      userId: context.userId,
      eventName: "Bulk Leads Deleted",
      details: `Removed ${ids.length} leads`,
    },
  });

  return c.json({ success: true, count: ids.length });
});

// 4. Fetch Single Lead Detail
app.get("/leads/:id", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: context.organizationId },
  });

  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }

  return c.json({ lead });
});

// 5. Update Lead (Status, Notes, Budget, etc.)
app.patch("/leads/:id", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const body = await c.req.json();

  const existingLead = await prisma.lead.findFirst({
    where: { id, organizationId: context.organizationId },
  });

  if (!existingLead) {
    return c.json({ error: "Lead not found" }, 404);
  }

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: {
      status: body.status !== undefined ? body.status : existingLead.status,
      notes: body.notes !== undefined ? body.notes : existingLead.notes,
      budget: body.budget !== undefined ? body.budget : existingLead.budget,
      company: body.company !== undefined ? body.company : existingLead.company,
      phone: body.phone !== undefined ? body.phone : existingLead.phone,
    },
  });

  if (body.status && body.status !== existingLead.status) {
    await prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.userId,
        eventName: body.status === "Closed" ? "Lead Closed" : "Status Changed",
        details: `${existingLead.name} → ${body.status}`,
      },
    });
  }

  return c.json({ lead: updatedLead });
});

// 6. Delete Lead
app.delete("/leads/:id", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");
  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: context.organizationId },
  });

  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }

  await prisma.lead.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      organizationId: context.organizationId,
      userId: context.userId,
      eventName: "Lead Removed",
      details: lead.name,
    },
  });

  return c.json({ success: true });
});

// 7. Workspace Members API
app.get("/workspace/members", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const members = await prisma.membership.findMany({
    where: { organizationId: context.organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { role: "asc" },
  });

  return c.json({ members });
});

app.get("/workspace/members/pending", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const prefix = `invite:${context.organizationId}:`;
  const pending = await prisma.verification.findMany({
    where: {
      identifier: { startsWith: prefix },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  const invites = pending.map((v) => ({
    id: v.id,
    email: v.identifier.replace(prefix, ""),
    expiresAt: v.expiresAt,
  }));

  return c.json({ invites });
});

app.delete("/workspace/members/invite/:id", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (context.role !== "Owner") {
    return c.json({ error: "Forbidden: Only Owners can cancel invites" }, 403);
  }

  const id = c.req.param("id");
  const invite = await prisma.verification.findFirst({
    where: { id, identifier: { startsWith: `invite:${context.organizationId}:` } },
  });

  if (!invite) {
    return c.json({ error: "Invite not found" }, 404);
  }

  await prisma.verification.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      organizationId: context.organizationId,
      userId: context.userId,
      eventName: "Invite Cancelled",
      details: invite.identifier.replace(`invite:${context.organizationId}:`, ""),
    },
  });

  return c.json({ success: true });
});

app.post("/workspace/members/invite", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (context.role !== "Owner") {
    return c.json({ error: "Forbidden: Only Owners can invite members" }, 403);
  }

  const { email } = await c.req.json();
  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.membership.findFirst({
      where: { organizationId: context.organizationId, userId: existingUser.id },
    });
    if (existingMembership) {
      return c.json({ error: "User is already a member of this workspace" }, 400);
    }

    if (existingUser.accounts.length > 0) {
      const membership = await prisma.membership.create({
        data: {
          organizationId: context.organizationId,
          userId: existingUser.id,
          role: "Member",
        },
      });

      await prisma.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          eventName: "Member Invited",
          details: email,
        },
      });

      sendInviteEmail({
        toEmail: email,
        inviterName: context.userName,
        workspaceName: context.organizationName,
        joinUrl: `${process.env.APP_URL || "http://localhost:3000"}/login`,
      }).catch((err) => {
        console.error("[invite] Failed to send invite email:", err.message);
      });

      return c.json({ membership });
    }

    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const inviteIdentifier = `invite:${context.organizationId}:${email}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const existing = await prisma.verification.findFirst({
    where: { identifier: inviteIdentifier, value: context.organizationId },
  });
  if (existing) {
    await prisma.verification.update({
      where: { id: existing.id },
      data: { expiresAt },
    });
  } else {
    await prisma.verification.create({
      data: {
        identifier: inviteIdentifier,
        value: context.organizationId,
        expiresAt,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      organizationId: context.organizationId,
      userId: context.userId,
      eventName: "Member Invited",
      details: email,
    },
  });

  const joinUrl = `${process.env.APP_URL || "http://localhost:3000"}/register?invite=${encodeURIComponent(email)}&org=${context.organizationId}`;
  sendInviteEmail({
    toEmail: email,
    inviterName: context.userName,
    workspaceName: context.organizationName,
    joinUrl,
  }).catch((err) => {
    console.error("[invite] Failed to send invite email:", err.message);
  });

  return c.json({ success: true, message: "Invite sent. Teammate can claim it upon sign up." });
});

app.post("/workspace/accept-invite", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || !session.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userEmail = session.user.email;
  const userId = session.user.id;

  const pendingInvites = await prisma.verification.findMany({
    where: {
      identifier: { startsWith: `invite:` },
      expiresAt: { gt: new Date() },
    },
  });

  const myInvites = pendingInvites.filter((v) =>
    v.identifier === `invite:${v.value}:${userEmail}`
  );

  if (myInvites.length === 0) {
    return c.json({ joined: false, message: "No pending invites found." });
  }

  const joined: string[] = [];
  for (const invite of myInvites) {
    const orgId = invite.value;

    const existing = await prisma.membership.findFirst({
      where: { organizationId: orgId, userId },
    });
    if (existing) {
      await prisma.verification.delete({ where: { id: invite.id } });
      continue;
    }

    await prisma.membership.create({
      data: { organizationId: orgId, userId, role: "Member" },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        eventName: "Member Joined",
        details: userEmail,
      },
    });

    await prisma.verification.delete({ where: { id: invite.id } });
    joined.push(orgId);
  }

  return c.json({ joined: joined.length > 0, organizations: joined });
});

app.delete("/workspace/members/:id", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (context.role !== "Owner") {
    return c.json({ error: "Forbidden: Only Owners can remove members" }, 403);
  }

  const id = c.req.param("id");

  const membership = await prisma.membership.findFirst({
    where: {
      id,
      organizationId: context.organizationId,
    },
    include: {
      user: true,
    },
  });

  if (!membership) {
    return c.json({ error: "Membership not found" }, 404);
  }

  if (membership.userId === context.userId) {
    return c.json({ error: "Cannot remove yourself from agency workspace" }, 400);
  }

  await prisma.membership.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      organizationId: context.organizationId,
      userId: context.userId,
      eventName: "Member Removed",
      details: membership.user.email,
    },
  });

  return c.json({ success: true });
});

app.patch("/workspace/members/:id", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (context.role !== "Owner") {
    return c.json({ error: "Forbidden: Only Owners can modify member roles" }, 403);
  }

  const id = c.req.param("id");
  const { role } = await c.req.json();
  if (role !== "Owner" && role !== "Member") {
    return c.json({ error: "Invalid role specified" }, 400);
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id,
      organizationId: context.organizationId,
    },
    include: {
      user: true,
    },
  });

  if (!membership) {
    return c.json({ error: "Membership not found" }, 404);
  }

  await prisma.membership.update({
    where: { id },
    data: { role },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: context.organizationId,
      userId: context.userId,
      eventName: "Member Role Changed",
      details: `${membership.user.email} -> ${role}`,
    },
  });

  return c.json({ success: true });
});

// 8. Fetch Scoped Audit Logs
app.get("/workspace/activity", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const logs = await prisma.auditLog.findMany({
    where: { organizationId: context.organizationId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });

  return c.json({ logs });
});

// 9. Fetch Workspace Stats
app.get("/workspace/stats", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [membersCount, totalLeads, newLeadsCount, lastActivity] = await Promise.all([
    prisma.membership.count({ where: { organizationId: context.organizationId } }),
    prisma.lead.count({ where: { organizationId: context.organizationId } }),
    prisma.lead.count({ where: { organizationId: context.organizationId, status: "New" } }),
    prisma.auditLog.findFirst({
      where: { organizationId: context.organizationId },
      orderBy: { timestamp: "desc" },
    }),
  ]);

  return c.json({
    workspaceName: context.organizationName,
    membersCount,
    totalLeads,
    newLeadsCount,
    lastActivity: lastActivity ? lastActivity.timestamp : null,
  });
});

// 10. Complete Setup
app.post("/workspace/complete-setup", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || !session.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { fullName, orgName } = await c.req.json();
  if (!fullName || !orgName) {
    return c.json({ error: "All fields are required" }, 400);
  }

  try {
    if (fullName !== session.user.name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: fullName },
      });
    }

    const organization = await prisma.organization.create({
      data: { name: orgName },
    });

    await prisma.membership.create({
      data: {
        organizationId: organization.id,
        userId: session.user.id,
        role: "Owner",
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: session.user.id,
        eventName: "Workspace Created",
        details: orgName,
      },
    });

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Failed to complete setup" }, 400);
  }
});

// 11. Update Workspace Settings
app.patch("/workspace", async (c) => {
  const context = await getSessionContext(c.req.raw.headers);
  if (!context) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (context.role !== "Owner") {
    return c.json({ error: "Forbidden: Only Owners can edit agency settings" }, 403);
  }

  const { name } = await c.req.json();
  if (!name || name.trim().length < 2) {
    return c.json({ error: "Agency workspace name must be at least 2 characters" }, 400);
  }

  try {
    const oldName = context.organizationName;
    const organization = await prisma.organization.update({
      where: { id: context.organizationId },
      data: { name: name.trim() },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: context.organizationId,
        userId: context.userId,
        eventName: "Workspace Renamed",
        details: `${oldName} -> ${name.trim()}`,
      },
    });

    return c.json({ success: true, organization });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Failed to update workspace" }, 400);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
export const PUT = handle(app);
