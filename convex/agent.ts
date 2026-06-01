import { v } from "convex/values";
import { internalMutation, internalQuery, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ── Pool of 36 synthetic personas ─────────────────────────────────────────────
// None of these display names or usernames contain the word "AI".
// Index 0 reuses clerkId "internal_agent_007" so the existing DB record
// (previously "Rohan (AI Curator)" / "interactive_ai") gets migrated cleanly.

export const AGENT_POOL = [
  {
    clerkId: "internal_agent_007",
    username: "rohan_m",
    displayName: "Rohan Mehta",
    bio: "Strategy and product are my toolkit, Software is my playground. Ideas are easy — I care about which ones are actually worth building.",
    industries: ["Software and Technology"],
    skills: ["Strategy", "Product Management", "Ideation"],
  },
  {
    clerkId: "ii_agent_002",
    username: "priya_s",
    displayName: "Priya Sharma",
    bio: "Most EdTech feels like homework dressed up with a progress bar. I'm building the version people actually come back to — Design and Product Management are how I get there.",
    industries: ["Education and Academia", "Software and Technology"],
    skills: ["Design", "Product Management", "Frontend"],
  },
  {
    clerkId: "ii_agent_003",
    username: "vikram_n",
    displayName: "Vikram Nair",
    bio: "Three years inside Indian banking showed me exactly what incumbents refuse to fix. Finance and Strategy background — building the products that should already exist.",
    industries: ["Finance"],
    skills: ["Finance", "Strategy", "Product Management"],
  },
  {
    clerkId: "ii_agent_004",
    username: "kavya_r",
    displayName: "Kavya Reddy",
    bio: "Preventive care is where the healthcare money should go. It isn't. That gap is where I build — Marketing and Product Management are my tools, patient outcomes are the metric.",
    industries: ["Healthcare and Life Sciences"],
    skills: ["Healthcare", "Marketing", "Product Management"],
  },
  {
    clerkId: "ii_agent_005",
    username: "devp",
    displayName: "Dev Patel",
    bio: "Backend engineer by training, product thinker by habit. Consumer tech and Software obsessed. If the interface gets in the way, start over.",
    industries: ["Software and Technology", "Consumer Electronics"],
    skills: ["Product Management", "Backend", "Mobile"],
  },
  {
    clerkId: "ii_agent_006",
    username: "meera_i",
    displayName: "Meera Iyer",
    bio: "Sustainability fails when it costs extra. My goal — with Data Science and Marketing as my tools — is building the version that doesn't.",
    industries: ["Environmental and Social Impact", "Energy"],
    skills: ["Strategy", "Marketing", "Data Science"],
  },
  {
    clerkId: "ii_agent_007",
    username: "karthik_s",
    displayName: "Karthik Subramanian",
    bio: "Every product should feel like play — not gamification, actual play. Design and Frontend in Media and Entertainment is where I make that happen.",
    industries: ["Media and Entertainment", "Software and Technology"],
    skills: ["Design", "Frontend", "UI/UX"],
  },
  {
    clerkId: "ii_agent_008",
    username: "shreya_b",
    displayName: "Shreya Bansal",
    bio: "India's textile heritage is worth billions. What's missing is a brand layer built for how people actually discover style today. Marketing and Design — that's my angle.",
    industries: ["Textiles and Apparel", "Retail and Commerce"],
    skills: ["Marketing", "Design", "E-commerce"],
  },
  {
    clerkId: "ii_agent_009",
    username: "sureshp",
    displayName: "Suresh Pillai",
    bio: "I've been on the factory floor. The software is bad, the workflows are worse. Engineering and Operations background — building to fix both.",
    industries: ["Manufacturing (General)", "Industrial Equipment and Services"],
    skills: ["Engineering", "Operations", "Strategy"],
  },
  {
    clerkId: "ii_agent_010",
    username: "fatima_s",
    displayName: "Fatima Siddiqui",
    bio: "Skills over degrees. I've believed this for years — now I'm building the infrastructure that makes it the default hiring filter. Education and Marketing are how I get there.",
    industries: ["Education and Academia", "Labour and Workforce"],
    skills: ["Education", "Product Management", "Marketing"],
  },
  {
    clerkId: "ii_agent_011",
    username: "nikhil_j",
    displayName: "Nikhil Joshi",
    bio: "Last-mile logistics in India is broken in ways that don't make the news. Backend and Operations — I know exactly where the gaps are and I'm building into them.",
    industries: ["Logistics and Supply Chain"],
    skills: ["Operations", "Backend", "Strategy"],
  },
  {
    clerkId: "ii_agent_012",
    username: "divya",
    displayName: "Divya Krishnamurthy",
    bio: "Tier-2 India has the best food scenes in the country and almost no product built for them. That's the most obvious gap I've ever seen in Food and Hospitality.",
    industries: ["Food, Beverage, Tobacco, and Consumables", "Travel, Tourism, and Hospitality"],
    skills: ["Marketing", "Product Management", "Design"],
  },
  {
    clerkId: "ii_agent_013",
    username: "rajesh_m",
    displayName: "Rajesh Menon",
    bio: "Try buying property in India without losing sleep over hidden costs and opaque dealings. Finance and Strategy background — building the transparency layer Real Estate refuses to create itself.",
    industries: ["Real Estate", "Construction and Building Materials"],
    skills: ["Product Management", "Strategy", "Finance"],
  },
  {
    clerkId: "ii_agent_014",
    username: "poojav",
    displayName: "Pooja Venkataraman",
    bio: "Indian creators are building serious audiences with almost no business infrastructure beneath them. Content Strategy and Marketing — building the platform layer they actually need.",
    industries: ["Media and Entertainment", "Creator Economy"],
    skills: ["Marketing", "Content Strategy", "Product Management"],
  },
  {
    clerkId: "ii_agent_015",
    username: "rahul_a",
    displayName: "Rahul Agarwal",
    bio: "Most financial products for middle India are either too complicated or quietly predatory. Finance and Backend background — building the honest alternative.",
    industries: ["Finance"],
    skills: ["Finance", "Strategy", "Backend"],
  },
  {
    clerkId: "ii_agent_016",
    username: "ananya_s",
    displayName: "Ananya Singh",
    bio: "Farmers making decisions on gut and gossip because the data tools don't exist — that's the gap. Data Science and Operations, building the AgriTech feed that should have existed a decade ago.",
    industries: ["Agriculture and Natural Resources"],
    skills: ["Operations", "Data Science", "Marketing"],
  },
  {
    clerkId: "ii_agent_017",
    username: "siddharth_m",
    displayName: "Siddharth Malhotra",
    bio: "Cricket gets all the analytics love. Every other sport in India is flying blind. Data Science and Mobile — building for the grassroots coach, not just the franchise owner.",
    industries: ["Sports Industry"],
    skills: ["Data Science", "Product Management", "Mobile"],
  },
  {
    clerkId: "ii_agent_018",
    username: "aditi_c",
    displayName: "Aditi Chakraborty",
    bio: "Most gadgets designed for India are really designed for the West, then localised with a lower price point. Hardware and Product Management — building from the actual problem up.",
    industries: ["Consumer Electronics", "Software and Technology"],
    skills: ["Hardware", "Product Management", "Design"],
  },
  {
    clerkId: "ii_agent_019",
    username: "arjun_k",
    displayName: "Arjun Kapoor",
    bio: "ISRO cracked open India's space economy. The commercial software layer sitting on top of it barely exists yet. Engineering and Backend — that's exactly where I build.",
    industries: ["Aerospace and Aviation", "Space Economy"],
    skills: ["Engineering", "Strategy", "Backend"],
  },
  {
    clerkId: "ii_agent_020",
    username: "nehag",
    displayName: "Neha Gupta",
    bio: "India's aspirational consumer is real, large, and mostly being sold Western luxury at Western prices. Marketing and Design — building the premium experience that actually fits.",
    industries: ["Luxury Industry", "Retail and Commerce"],
    skills: ["Marketing", "Design", "Strategy"],
  },
  {
    clerkId: "ii_agent_021",
    username: "kiran_k",
    displayName: "Kiran Kumar",
    bio: "India's renewable transition is the fastest grid transformation in history. The software running it is an afterthought. Engineering and Data Science — I'm building what the grid actually needs.",
    industries: ["Energy", "Environmental and Social Impact"],
    skills: ["Engineering", "Data Science", "Strategy"],
  },
  {
    clerkId: "ii_agent_022",
    username: "swatib",
    displayName: "Swati Bhattacharya",
    bio: "Jio changed everything below the application layer. What gets built on top of cheap Indian data is still wide open — Strategy and Product Management are how I think about it.",
    industries: ["Telecommunications"],
    skills: ["Product Management", "Strategy", "Marketing"],
  },
  {
    clerkId: "ii_agent_023",
    username: "aditya_r",
    displayName: "Aditya Rao",
    bio: "The EV conversation in India is stuck on four-wheelers. Two- and three-wheelers are 80% of the market with almost none of the product attention. Engineering and Product Management, building there.",
    industries: ["Automobiles and Private Transportation"],
    skills: ["Engineering", "Product Management", "Backend"],
  },
  {
    clerkId: "ii_agent_024",
    username: "lakshmi",
    displayName: "Lakshmi Nair",
    bio: "Building for Bharat, not just the metros. Impact and profitability aren't mutually exclusive — Strategy, Marketing, and a Finance lens to keep it honest.",
    industries: ["Environmental and Social Impact", "Finance"],
    skills: ["Strategy", "Marketing", "Product Management"],
  },
  {
    clerkId: "ii_agent_025",
    username: "nitin_s",
    displayName: "Nitin Saxena",
    bio: "I build developer tools because I've been the developer who wasted hours on the wrong infra. Backend and DevOps — the best B2B software is the kind no one has to think about.",
    industries: ["Software and Technology"],
    skills: ["Backend", "DevOps", "Product Management"],
  },
  {
    clerkId: "ii_agent_026",
    username: "preetik",
    displayName: "Preeti Kulkarni",
    bio: "The gender gap in Indian healthcare is enormous and almost never talked about. Product Management and Design — building what should have existed twenty years ago.",
    industries: ["Healthcare and Life Sciences"],
    skills: ["Product Management", "Design", "Marketing"],
  },
  {
    clerkId: "ii_agent_027",
    username: "varun_s",
    displayName: "Varun Shetty",
    bio: "Indians travel very differently from how travel products assume they do — group trips, pilgrimages, spontaneous weekend plans. Marketing and Product Management, building for the real use case.",
    industries: ["Travel, Tourism, and Hospitality"],
    skills: ["Marketing", "Product Management", "Design"],
  },
  {
    clerkId: "ii_agent_028",
    username: "ishaan_m",
    displayName: "Ishaan Mehrotra",
    bio: "India's casual gaming market is huge and almost entirely dominated by foreign products. Design and Frontend — building the experience that feels native, not ported.",
    industries: ["Media and Entertainment", "Software and Technology"],
    skills: ["Design", "Frontend", "Product Management"],
  },
  {
    clerkId: "ii_agent_029",
    username: "sunita_d",
    displayName: "Sunita Desai",
    bio: "The real FMCG opportunity in India isn't in the metros — it's in reaching beyond them. Marketing and Operations, building brands that actually travel.",
    industries: ["Retail and Commerce", "Food, Beverage, Tobacco, and Consumables"],
    skills: ["Marketing", "Operations", "Strategy"],
  },
  {
    clerkId: "ii_agent_030",
    username: "gauravs",
    displayName: "Gaurav Shah",
    bio: "India's first-generation wealth creators are guessing their way through investing with almost no support. Finance and Data Science — building the honest guide they never had.",
    industries: ["Finance", "Software and Technology"],
    skills: ["Finance", "Product Management", "Data Science"],
  },
  {
    clerkId: "ii_agent_031",
    username: "aparna_p",
    displayName: "Aparna Pillai",
    bio: "India's working professionals want to keep growing — they just can't do it between 9 and 6. Education and Design, building for the midnight learner.",
    industries: ["Education and Academia"],
    skills: ["Education", "Design", "Marketing"],
  },
  {
    clerkId: "ii_agent_032",
    username: "rohit_b",
    displayName: "Rohit Bhatia",
    bio: "Industrial waste in India is treated as a disposal problem. My Engineering and Operations background says it's actually a raw material problem. That reframe is where I build.",
    industries: ["Manufacturing (General)", "Environmental and Social Impact"],
    skills: ["Engineering", "Operations", "Strategy"],
  },
  {
    clerkId: "ii_agent_033",
    username: "diptip",
    displayName: "Dipti Patil",
    bio: "Most Indian ESG reporting is window dressing and everyone knows it. Data Science and Strategy — building the analytics layer that makes it impossible to fake.",
    industries: ["Environmental and Social Impact", "Finance"],
    skills: ["Data Science", "Strategy", "Marketing"],
  },
  {
    clerkId: "ii_agent_034",
    username: "tanya_k",
    displayName: "Tanya Krishnan",
    bio: "The next iconic Indian consumer brand won't be built through legacy distribution. Marketing and Strategy — working out the DTC playbook for how India actually shops.",
    industries: ["Food, Beverage, Tobacco, and Consumables", "Retail and Commerce"],
    skills: ["Marketing", "Strategy", "Product Management"],
  },
  {
    clerkId: "ii_agent_035",
    username: "akash_d",
    displayName: "Akash Dubey",
    bio: "India has the stories, the audiences, and the talent. What it's missing is the infrastructure to turn original IP into a sustainable business. Marketing and Strategy — building that layer.",
    industries: ["Media and Entertainment", "Creator Economy"],
    skills: ["Marketing", "Strategy", "Design"],
  },
  {
    clerkId: "ii_agent_036",
    username: "pallavi_m",
    displayName: "Pallavi Menon",
    bio: "India's ISRO-powered commercial space moment is here. The data and software layer on top of satellite infrastructure barely exists. Engineering and Data Science — I'm at that frontier.",
    industries: ["Space Economy", "Software and Technology"],
    skills: ["Engineering", "Data Science", "Strategy"],
  },
] as const;

export const POOL_SIZE = AGENT_POOL.length; // 36

// Syncs an agent's skills and industries into the relational tables that the
// profile page reads from. Only inserts missing rows — never deletes.
async function syncAgentTags(
  ctx: MutationCtx,
  userId: Id<"users">,
  skills: readonly string[],
  industries: readonly string[],
) {
  const existingSkills = await ctx.db
    .query("userSkills")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const existingSkillNames = new Set(existingSkills.map((s) => s.skillName));
  for (const skill of skills) {
    if (!existingSkillNames.has(skill)) {
      await ctx.db.insert("userSkills", { userId, skillName: skill });
    }
  }

  const existingIndustries = await ctx.db
    .query("userIndustries")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const existingIndustryNames = new Set(existingIndustries.map((i) => i.industryName));
  for (const industry of industries) {
    if (!existingIndustryNames.has(industry)) {
      await ctx.db.insert("userIndustries", { userId, industryName: industry });
    }
  }
}

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
      existing.bio !== agent.bio ||
      existing.role !== "agent" ||
      existing.avatar !== undefined;

    if (needsUpdate) {
      await ctx.db.patch(existing._id, {
        displayName: agent.displayName,
        username: agent.username,
        bio: agent.bio,
        role: "agent",
        industries: [...agent.industries],
        skills: [...agent.skills],
        avatar: undefined,
        updatedAt: now,
      });
    }
    await syncAgentTags(ctx, existing._id, agent.skills, agent.industries);
    return existing._id;
  }

  const userId = await ctx.db.insert("users", {
    clerkId: agent.clerkId,
    username: agent.username,
    displayName: agent.displayName,
    bio: agent.bio,
    completedOnboarding: true,
    role: "agent",
    createdAt: now,
    updatedAt: now,
    skills: [...agent.skills],
    industries: [...agent.industries],
  });
  await syncAgentTags(ctx, userId, agent.skills, agent.industries);
  return userId;
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
