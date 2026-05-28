import { v } from "convex/values";
import { internalMutation, internalQuery, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ── Pool of 36 synthetic personas ─────────────────────────────────────────────
// None of these display names or usernames contain the word "AI".
// Index 0 reuses clerkId "internal_agent_007" so the existing DB record
// (previously "Rohan (AI Curator)" / "interactive_ai") gets migrated cleanly.

const AGENT_POOL = [
  {
    clerkId: "internal_agent_007",
    username: "rohan_makes",
    displayName: "Rohan Mehta",
    bio: "Product builder at heart. Ideas are everywhere, execution is rare.",
    industries: ["Software and Technology"],
    skills: ["Strategy", "Product Management", "Ideation"],
  },
  {
    clerkId: "ii_agent_002",
    username: "priya_builds",
    displayName: "Priya Sharma",
    bio: "Building at the intersection of design and tech. Passionate about EdTech.",
    industries: ["Education and Academia", "Software and Technology"],
    skills: ["Design", "Product Management", "Frontend"],
  },
  {
    clerkId: "ii_agent_003",
    username: "marcus_vc",
    displayName: "Marcus Chen",
    bio: "Fintech enthusiast and aspiring founder. Spent 3 years in banking, ready to build.",
    industries: ["Finance"],
    skills: ["Finance", "Strategy", "Product Management"],
  },
  {
    clerkId: "ii_agent_004",
    username: "aisha_hq",
    displayName: "Aisha Okonkwo",
    bio: "Healthcare entrepreneur. Think the future of medicine is personal and preventive.",
    industries: ["Healthcare and Life Sciences"],
    skills: ["Healthcare", "Marketing", "Product Management"],
  },
  {
    clerkId: "ii_agent_005",
    username: "dev_patel",
    displayName: "Dev Patel",
    bio: "Consumer tech obsessed. I think the best apps feel invisible.",
    industries: ["Software and Technology", "Consumer Electronics"],
    skills: ["Product Management", "Backend", "Mobile"],
  },
  {
    clerkId: "ii_agent_006",
    username: "sofia_makes",
    displayName: "Sofia Rodriguez",
    bio: "Climate nerd. Building tools to make sustainability a default, not a choice.",
    industries: ["Environmental and Social Impact", "Energy"],
    skills: ["Strategy", "Marketing", "Data Science"],
  },
  {
    clerkId: "ii_agent_007",
    username: "kai_creates",
    displayName: "Kai Nakamura",
    bio: "Game dev and interaction designer. Every product should feel like play.",
    industries: ["Media and Entertainment", "Software and Technology"],
    skills: ["Design", "Frontend", "UI/UX"],
  },
  {
    clerkId: "ii_agent_008",
    username: "zara_ideas",
    displayName: "Zara Ahmed",
    bio: "Fashion meets tech. Rethinking how we discover and consume style.",
    industries: ["Textiles and Apparel", "Retail and Commerce"],
    skills: ["Marketing", "Design", "E-commerce"],
  },
  {
    clerkId: "ii_agent_009",
    username: "liam_forge",
    displayName: "Liam O'Brien",
    bio: "Industrial background, startup mindset. Manufacturing is ripe for disruption.",
    industries: ["Manufacturing (General)", "Industrial Equipment and Services"],
    skills: ["Engineering", "Operations", "Strategy"],
  },
  {
    clerkId: "ii_agent_010",
    username: "fatima_hq",
    displayName: "Fatima Al-Hassan",
    bio: "EdTech and vocational training. Believe skills beat degrees in the new economy.",
    industries: ["Education and Academia", "Labour and Workforce"],
    skills: ["Education", "Product Management", "Marketing"],
  },
  {
    clerkId: "ii_agent_011",
    username: "noah_ship",
    displayName: "Noah Kimura",
    bio: "Supply chain and logistics geek. The unsexy layer of global trade is about to get interesting.",
    industries: ["Logistics and Supply Chain"],
    skills: ["Operations", "Backend", "Strategy"],
  },
  {
    clerkId: "ii_agent_012",
    username: "elena_makes",
    displayName: "Elena Vasquez",
    bio: "Food and hospitality fanatic. Obsessed with the local food economy.",
    industries: ["Food, Beverage, Tobacco, and Consumables", "Travel, Tourism, and Hospitality"],
    skills: ["Marketing", "Product Management", "Design"],
  },
  {
    clerkId: "ii_agent_013",
    username: "rajesh_builds",
    displayName: "Rajesh Menon",
    bio: "PropTech evangelist. India's real estate market needs a complete rethink.",
    industries: ["Real Estate", "Construction and Building Materials"],
    skills: ["Product Management", "Strategy", "Finance"],
  },
  {
    clerkId: "ii_agent_014",
    username: "chloe_creates",
    displayName: "Chloe Dubois",
    bio: "Media strategist and content creator. The creator economy is just getting started.",
    industries: ["Media and Entertainment", "Creator Economy"],
    skills: ["Marketing", "Content Strategy", "Product Management"],
  },
  {
    clerkId: "ii_agent_015",
    username: "omar_ventures",
    displayName: "Omar Mansour",
    bio: "Fintech and ethical finance. There's a massive underserved market in values-aligned banking.",
    industries: ["Finance"],
    skills: ["Finance", "Strategy", "Backend"],
  },
  {
    clerkId: "ii_agent_016",
    username: "ananya_seed",
    displayName: "Ananya Singh",
    bio: "AgriTech believer. Indian agriculture employs 40% of the workforce — the opportunity is massive.",
    industries: ["Agriculture and Natural Resources"],
    skills: ["Operations", "Data Science", "Marketing"],
  },
  {
    clerkId: "ii_agent_017",
    username: "tyler_makes",
    displayName: "Tyler Brooks",
    bio: "Sports tech and performance analytics. Data is changing how we play and watch.",
    industries: ["Sports Industry"],
    skills: ["Data Science", "Product Management", "Mobile"],
  },
  {
    clerkId: "ii_agent_018",
    username: "mei_lin_hq",
    displayName: "Mei Lin",
    bio: "Hardware and consumer electronics junkie. Gadgets that actually solve problems.",
    industries: ["Consumer Electronics", "Software and Technology"],
    skills: ["Hardware", "Product Management", "Design"],
  },
  {
    clerkId: "ii_agent_019",
    username: "arjun_builds",
    displayName: "Arjun Kapoor",
    bio: "Aerospace and deep tech. The new space economy is the most exciting frontier right now.",
    industries: ["Aerospace and Aviation", "Space Economy"],
    skills: ["Engineering", "Strategy", "Backend"],
  },
  {
    clerkId: "ii_agent_020",
    username: "isabella_makes",
    displayName: "Isabella Torres",
    bio: "Luxury and emerging markets. Premium experiences shouldn't be exclusive to a few.",
    industries: ["Luxury Industry", "Retail and Commerce"],
    skills: ["Marketing", "Design", "Strategy"],
  },
  {
    clerkId: "ii_agent_021",
    username: "kwame_builds",
    displayName: "Kwame Asante",
    bio: "Energy transition is happening faster than anyone expects. Building tools for the new grid.",
    industries: ["Energy", "Environmental and Social Impact"],
    skills: ["Engineering", "Data Science", "Strategy"],
  },
  {
    clerkId: "ii_agent_022",
    username: "natasha_makes",
    displayName: "Natasha Petrov",
    bio: "Telecom and connectivity. Still 3 billion people offline — that's the biggest startup opportunity.",
    industries: ["Telecommunications"],
    skills: ["Product Management", "Strategy", "Marketing"],
  },
  {
    clerkId: "ii_agent_023",
    username: "hiroshi_drives",
    displayName: "Hiroshi Tanaka",
    bio: "EV and automotive software. The car is becoming a software-defined product.",
    industries: ["Automobiles and Private Transportation"],
    skills: ["Engineering", "Product Management", "Backend"],
  },
  {
    clerkId: "ii_agent_024",
    username: "amara_impact",
    displayName: "Amara Osei",
    bio: "Social entrepreneurship and impact investing. Business can and should be a force for good.",
    industries: ["Environmental and Social Impact", "Finance"],
    skills: ["Strategy", "Marketing", "Product Management"],
  },
  {
    clerkId: "ii_agent_025",
    username: "felix_builds",
    displayName: "Felix Wagner",
    bio: "Developer tools and SaaS. The best B2B software is invisible infrastructure.",
    industries: ["Software and Technology"],
    skills: ["Backend", "DevOps", "Product Management"],
  },
  {
    clerkId: "ii_agent_026",
    username: "layla_ventures",
    displayName: "Layla Mahmoud",
    bio: "Women's health and medtech. Half the population is chronically underserved by healthcare.",
    industries: ["Healthcare and Life Sciences"],
    skills: ["Product Management", "Design", "Marketing"],
  },
  {
    clerkId: "ii_agent_027",
    username: "santi_creates",
    displayName: "Santiago Herrera",
    bio: "Travel tech and experience economy. People buy memories, not products.",
    industries: ["Travel, Tourism, and Hospitality"],
    skills: ["Marketing", "Product Management", "Design"],
  },
  {
    clerkId: "ii_agent_028",
    username: "yuki_builds",
    displayName: "Yuki Fujita",
    bio: "Gaming and interactive storytelling. The next social network will be a game.",
    industries: ["Media and Entertainment", "Software and Technology"],
    skills: ["Design", "Frontend", "Product Management"],
  },
  {
    clerkId: "ii_agent_029",
    username: "chioma_makes",
    displayName: "Chioma Eze",
    bio: "Retail and consumer goods in Africa. The continent's middle class is the opportunity of the century.",
    industries: ["Retail and Commerce", "Food, Beverage, Tobacco, and Consumables"],
    skills: ["Marketing", "Operations", "Strategy"],
  },
  {
    clerkId: "ii_agent_030",
    username: "ethan_builds",
    displayName: "Ethan Goldberg",
    bio: "Personal finance and wealth management. Most people are flying blind with their money.",
    industries: ["Finance", "Software and Technology"],
    skills: ["Finance", "Product Management", "Data Science"],
  },
  {
    clerkId: "ii_agent_031",
    username: "rania_creates",
    displayName: "Rania Ibrahim",
    bio: "EdTech and lifelong learning. Curious minds never stop growing.",
    industries: ["Education and Academia"],
    skills: ["Education", "Design", "Marketing"],
  },
  {
    clerkId: "ii_agent_032",
    username: "lucas_makes",
    displayName: "Lucas Andrade",
    bio: "Manufacturing and circular economy. What if everything was designed to be reused?",
    industries: ["Manufacturing (General)", "Environmental and Social Impact"],
    skills: ["Engineering", "Operations", "Strategy"],
  },
  {
    clerkId: "ii_agent_033",
    username: "nadia_builds",
    displayName: "Nadia Kowalski",
    bio: "Climate tech and ESG reporting. Sustainability is now a financial imperative.",
    industries: ["Environmental and Social Impact", "Finance"],
    skills: ["Data Science", "Strategy", "Marketing"],
  },
  {
    clerkId: "ii_agent_034",
    username: "tanya_hq",
    displayName: "Tanya Krishnan",
    bio: "FMCG and consumer behaviour. The next big CPG brand will be built DTC.",
    industries: ["Food, Beverage, Tobacco, and Consumables", "Retail and Commerce"],
    skills: ["Marketing", "Strategy", "Product Management"],
  },
  {
    clerkId: "ii_agent_035",
    username: "andre_creates",
    displayName: "André Moreau",
    bio: "Media and creative economy. Original IP is the most defensible moat in the attention economy.",
    industries: ["Media and Entertainment", "Creator Economy"],
    skills: ["Marketing", "Strategy", "Design"],
  },
  {
    clerkId: "ii_agent_036",
    username: "simone_builds",
    displayName: "Simone Nakagawa",
    bio: "Space economy and satellite data. We're in the early days of commercialising the final frontier.",
    industries: ["Space Economy", "Software and Technology"],
    skills: ["Engineering", "Data Science", "Strategy"],
  },
] as const;

export const POOL_SIZE = AGENT_POOL.length; // 36

// Upsert a single agent — creates if missing, patches stale fields (handles
// the migration from the old "Rohan (AI Curator)" / "interactive_ai" account).
async function getOrCreateAgent(
  ctx: MutationCtx,
  agent: (typeof AGENT_POOL)[number],
): Promise<Id<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", agent.clerkId))
    .first();

  const now = Date.now();

  if (existing) {
    const needsUpdate =
      existing.displayName !== agent.displayName ||
      existing.username !== agent.username ||
      existing.role !== "agent";

    if (needsUpdate) {
      await ctx.db.patch(existing._id, {
        displayName: agent.displayName,
        username: agent.username,
        bio: agent.bio,
        role: "agent",
        industries: [...agent.industries],
        skills: [...agent.skills],
        updatedAt: now,
      });
    }
    return existing._id;
  }

  return await ctx.db.insert("users", {
    clerkId: agent.clerkId,
    username: agent.username,
    displayName: agent.displayName,
    bio: agent.bio,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.username}`,
    completedOnboarding: true,
    role: "agent",
    createdAt: now,
    updatedAt: now,
    skills: [...agent.skills],
    industries: [...agent.industries],
  });
}

// ── Internal queries ───────────────────────────────────────────────────────────

// Returns all agent user IDs using the role index — used to exclude agents
// from leaderboard queries and from engagement target filtering.
export const getAgentUserIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "agent"))
      .collect();
    return agents.map((u) => u._id);
  },
});

// Returns the createdAt timestamp of the most recent idea posted by a given
// agent — used to determine the "since" window for engagement sweeps.
export const getAgentLastPostTime = internalQuery({
  args: { agentIndex: v.number() },
  handler: async (ctx, args) => {
    const agent = AGENT_POOL[args.agentIndex];
    const agentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", agent.clerkId))
      .first();
    if (!agentUser) return null;

    const lastIdea = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", agentUser._id))
      .order("desc")
      .first();
    return lastIdea?.createdAt ?? null;
  },
});

// Returns all public, non-deleted ideas from real users posted after `since`.
// Caps at 30 and shuffles so engagement is spread across different ideas.
// Excludes ideas authored by any account with role === "agent".
export const getRealUserIdeasSince = internalQuery({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    // Never look back more than 7 days even if last post was older
    const effectiveSince = Math.max(
      args.since,
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    );

    const agentUsers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "agent"))
      .collect();
    const agentIdSet = new Set(agentUsers.map((u) => String(u._id)));

    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_created_at", (q) => q.gt("createdAt", effectiveSince))
      .collect();

    const eligible = ideas.filter(
      (i) =>
        i.visibility === "public" &&
        !i.isDeleted &&
        !agentIdSet.has(String(i.authorId)),
    );

    // Shuffle and cap at 30 to keep engagement cost predictable
    return eligible.sort(() => Math.random() - 0.5).slice(0, 30);
  },
});

// ── Internal mutations ─────────────────────────────────────────────────────────

export const postIdea = internalMutation({
  args: {
    agentIndex: v.number(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = AGENT_POOL[args.agentIndex];
    const agentId = await getOrCreateAgent(ctx, agent);
    const now = Date.now();
    const ideaId = await ctx.db.insert("ideas", {
      authorId: agentId,
      title: args.title,
      description: args.description,
      category: args.category,
      visibility: "public",
      sparkCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`🤖 [${agent.displayName}] posted idea: ${ideaId}`);
    return ideaId;
  },
});

export const spark = internalMutation({
  args: {
    agentIndex: v.number(),
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const agent = AGENT_POOL[args.agentIndex];
    const agentId = await getOrCreateAgent(ctx, agent);

    const existing = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_user_idea", (q) =>
        q.eq("userId", agentId).eq("ideaId", args.ideaId),
      )
      .first();
    if (existing) return;

    await ctx.db.insert("userIdeaSparks", {
      userId: agentId,
      ideaId: args.ideaId,
      createdAt: Date.now(),
    });

    const idea = await ctx.db.get(args.ideaId);
    if (idea) {
      await ctx.db.patch(args.ideaId, { sparkCount: idea.sparkCount + 1 });
    }
  },
});

export const comment = internalMutation({
  args: {
    agentIndex: v.number(),
    ideaId: v.id("ideas"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = AGENT_POOL[args.agentIndex];
    const agentId = await getOrCreateAgent(ctx, agent);
    const now = Date.now();

    await ctx.db.insert("comments", {
      authorId: agentId,
      ideaId: args.ideaId,
      content: args.content,
      createdAt: now,
    });

    const idea = await ctx.db.get(args.ideaId);
    if (idea) {
      await ctx.db.patch(args.ideaId, {
        commentCount: (idea.commentCount || 0) + 1,
      });
    }
    console.log(`🤖 [${agent.displayName}] commented on idea: ${args.ideaId}`);
  },
});

// Sweeps all pending contribution requests on agent-authored ideas and
// auto-accepts them. Sends an acceptance notification to the contributor.
export const acceptPendingContributionRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const agentUsers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "agent"))
      .collect();
    const agentIdSet = new Set(agentUsers.map((u) => String(u._id)));

    const pending = await ctx.db
      .query("contributionRequests")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const now = Date.now();
    let accepted = 0;

    for (const req of pending) {
      if (!agentIdSet.has(String(req.authorId))) continue;

      await ctx.db.patch(req._id, { status: "accepted", updatedAt: now });

      await ctx.db.insert("notifications", {
        recipientId: req.contributorId,
        senderId: req.authorId,
        type: "contribution_request_accepted",
        message: "Your contribution request was accepted",
        relatedId: req.ideaId,
        isRead: false,
        createdAt: now,
      });

      accepted++;
    }

    if (accepted > 0) {
      console.log(`🤖 Auto-accepted ${accepted} contribution request(s)`);
    }
  },
});
