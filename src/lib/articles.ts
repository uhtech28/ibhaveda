export type CategorySlug =
  | "venture-creation"
  | "startup-execution"
  | "founder-collaboration"
  | "open-innovation"
  | "future-of-entrepreneurship";

export type ArticleSection = {
  id: string;
  heading: string;
  body: string[];
  subsections?: {
    heading: string;
    body: string[];
  }[];
};

export type Category = {
  slug: CategorySlug;
  title: string;
  description: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
};

export type Article = {
  slug: string;
  category: CategorySlug;
  title: string;
  description: string;
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  sections: ArticleSection[];
};

export const SITE_URL = "https://interactiveideas.io";

export const categories: Category[] = [
  {
    slug: "venture-creation",
    title: "Venture Creation",
    description:
      "How raw ideas become tested ventures without pretending the first pitch is the company.",
    intro:
      "Venture creation is the work between inspiration and incorporation: pressure-testing the market, finding the right collaborators, shaping proof, and making progress visible before a startup has the polish of a company.",
    seoTitle: "Venture Creation Articles | Interactive Ideas",
    seoDescription:
      "Practical articles on venture creation platforms, startup idea development, validation, and turning early ideas into executable ventures.",
  },
  {
    slug: "startup-execution",
    title: "Startup Execution",
    description:
      "Execution systems for founders who need momentum, feedback loops, and visible progress.",
    intro:
      "Most early startup work fails quietly. Startup execution is about reducing that silence: breaking ideas into actions, testing assumptions, and making the next move obvious enough that teams keep moving.",
    seoTitle: "Startup Execution Articles | Interactive Ideas",
    seoDescription:
      "Founder-focused articles on gamified startup execution, launch momentum, early validation, and why promising startup ideas stall.",
  },
  {
    slug: "founder-collaboration",
    title: "Founder Collaboration",
    description:
      "A practical look at cofounder discovery, contribution, trust, and shared venture-building.",
    intro:
      "Founder collaboration is not networking with better branding. It is the operating layer where people reveal how they think, what they can build, and whether they can survive ambiguity together.",
    seoTitle: "Founder Collaboration Articles | Interactive Ideas",
    seoDescription:
      "Articles on finding cofounders online, evaluating collaborators, and building productive founder collaboration around early startup ideas.",
  },
  {
    slug: "open-innovation",
    title: "Open Innovation",
    description:
      "What happens when startup creation becomes more participatory, transparent, and contribution-driven.",
    intro:
      "Open innovation gives early ideas more surface area. Instead of hiding every unfinished thought, founders can expose the right problems to the right people and use contribution as a way to discover leverage.",
    seoTitle: "Open Innovation Articles | Interactive Ideas",
    seoDescription:
      "Explore open entrepreneurship, crowdsolving, public problem-solving, and collaborative startup creation with Interactive Ideas.",
  },
  {
    slug: "future-of-entrepreneurship",
    title: "Future of Entrepreneurship",
    description:
      "The next shape of venture-building: collaborative, AI-assisted, and less dependent on lone-founder mythology.",
    intro:
      "The future of entrepreneurship will not only be faster. It will be more networked, more assisted, and more honest about how ideas actually become companies: through repeated contact with people, tools, and reality.",
    seoTitle: "Future of Entrepreneurship Articles | Interactive Ideas",
    seoDescription:
      "Research-style articles on collaborative venture building, AI in startup creation, and the future of entrepreneurship.",
  },
];

const sharedPublishedAt = "2026-05-13";

export const articles: Article[] = [
  {
    slug: "what-is-a-venture-creation-platform",
    category: "venture-creation",
    title: "What Is a Venture Creation Platform?",
    description:
      "A venture creation platform helps founders move from loose ideas to structured startup progress by combining feedback, collaboration, execution, and visible learning.",
    readTime: "8 min read",
    publishedAt: sharedPublishedAt,
    updatedAt: sharedPublishedAt,
    sections: [
      {
        id: "not-an-idea-board",
        heading: "It is not a prettier idea board",
        body: [
          "An idea board stores thoughts. A venture creation platform changes what happens to those thoughts after the first burst of excitement wears off. The useful version gives founders a place to expose assumptions, invite contribution, convert interest into tasks, and measure whether the idea is becoming more real or simply more decorated.",
          "That distinction matters because early entrepreneurship has a strange failure mode: many ideas do not die from being wrong. They die because nobody can tell what the next honest step should be. The founder collects opinions, rewrites the pitch, waits for confidence, and slowly loses contact with the original problem.",
          "A venture creation platform should make uncertainty workable. It should help a founder ask better questions, show partial work, attract people with complementary skills, and turn vague enthusiasm into observable action.",
        ],
      },
      {
        id: "coordination",
        heading: "The real job is coordination",
        body: [
          "The hardest part of creating a venture is rarely the first idea. It is coordinating attention, context, and contribution around that idea long enough for evidence to appear. A platform can create a shared surface where a designer sees the customer problem, a technical builder sees the hard edge of the product, and a potential collaborator sees where they can help without asking for a meeting first.",
          "This is why the best venture creation workflows are not only about content. They are about state. What is assumed? What has been tested? Who is contributing? What is blocked? What changed after feedback? Without state, a startup idea becomes a story people keep retelling instead of a system people can improve.",
        ],
        subsections: [
          {
            heading: "Ideas need memory",
            body: [
              "Early feedback often disappears into chats and calls. A platform should preserve the learning trail so a team can see how the idea evolved. That memory prevents circular debates and helps new collaborators understand the current shape of the work.",
            ],
          },
          {
            heading: "Contributors need entry points",
            body: [
              "Most people will not join a project because the pitch sounds exciting. They join when they can see a specific problem where their skill matters. A venture creation platform should make those entry points obvious.",
            ],
          },
        ],
      },
      {
        id: "visibility",
        heading: "What a good platform makes visible",
        body: [
          "A strong venture creation platform makes the invisible parts of early company-building visible: assumptions, experiments, roles, progress, decisions, and unresolved questions. It does not need to replace judgment. It should make judgment easier by keeping the work close to reality.",
          "The most valuable visibility is not vanity visibility. Public likes, vague comments, and inflated enthusiasm can make an idea feel alive while hiding the fact that no one is doing the difficult work. Better signals include who returns to contribute, which objections repeat, what users try to do before being taught, and which tasks remain blocked after the excitement fades.",
          "Interactive Ideas is built around this premise: the path from idea to venture should be social, structured, and execution-oriented without forcing founders to prematurely perform like fully formed companies.",
        ],
      },
      {
        id: "why-now",
        heading: "Why this category matters now",
        body: [
          "Startup creation is becoming less dependent on private networks and more dependent on visible capability. AI can help with research, prototypes, drafts, and analysis, but founders still need people, judgment, accountability, and a way to convert outputs into direction.",
          "A venture creation platform sits in that gap. It helps founders use tools without becoming isolated operators, and it helps communities contribute without turning every early idea into noise. The future is not every idea becoming a company. The future is more ideas getting a fair, structured attempt before they are abandoned.",
        ],
      },
    ],
  },
  {
    slug: "how-to-turn-an-idea-into-a-startup",
    category: "venture-creation",
    title: "How to Turn an Idea Into a Startup",
    description:
      "Turning an idea into a startup means translating a sharp observation into proof, collaborators, execution loops, and a venture that can survive contact with reality.",
    readTime: "9 min read",
    publishedAt: sharedPublishedAt,
    updatedAt: sharedPublishedAt,
    sections: [
      {
        id: "tension",
        heading: "Start with tension, not a pitch",
        body: [
          "The pitch is usually the least honest version of a startup idea. It is smooth, compressed, and designed to remove doubt. But doubt is where the venture actually begins. Before a founder turns an idea into a startup, they need to identify the tension that makes the idea worth pursuing.",
          "A useful tension sounds like a conflict in the world: people want something but cannot get it, teams waste time because existing tools ignore a behavior, or a group has learned to tolerate a workaround so deeply that the workaround now looks normal. If you cannot name the tension, you probably only have a theme. Themes are interesting. Startups need pressure.",
        ],
      },
      {
        id: "assumptions",
        heading: "Convert the idea into assumptions",
        body: [
          "The next move is to break the idea into assumptions. Who has the problem? How painful is it? What are they doing today? Why has nobody solved it in a way they actually use? Which behavior would prove the idea is becoming real?",
          "This step protects the founder from polishing the wrong thing. A beautiful landing page can hide a weak problem. A clever feature can distract from a missing buyer. A passionate community can still fail to produce a business model.",
        ],
        subsections: [
          {
            heading: "Separate belief from evidence",
            body: [
              "Founders are allowed to believe. They just need to know when they are believing. Write down what is known, what is guessed, and what would change your mind. That discipline keeps early work from becoming theater.",
            ],
          },
          {
            heading: "Look for behavior",
            body: [
              "Compliments are weak evidence. Behavior is stronger. Did someone ask to use it? Did they share the problem with someone else? Did they offer time, data, feedback, or money before being pushed?",
            ],
          },
        ],
      },
      {
        id: "loop",
        heading: "Build the smallest execution loop",
        body: [
          "A startup starts forming when the founder creates a loop: identify a risk, take an action, expose the result, learn, and decide the next step. The loop can be tiny. It can be a prototype, a workflow mockup, a manual service, a community test, or a structured conversation with the exact people who feel the problem.",
          "The loop matters more than the artifact. A founder who repeats useful loops is building a venture. A founder who keeps improving a static pitch is usually building confidence, not proof.",
        ],
      },
      {
        id: "collaborators",
        heading: "Bring collaborators in before everything is clean",
        body: [
          "Many founders wait too long to involve others. They want the idea to be impressive first. The problem is that early collaborators are most valuable before the work is polished, when the shape is still flexible and the hidden risks are still visible.",
          "The right collaborators do not only add labor. They add different instincts. A technical founder may see feasibility risk. A domain expert may see adoption risk. A designer may see where the user will hesitate. A community builder may see whether the idea has social energy or only intellectual appeal.",
        ],
      },
    ],
  },
  {
    slug: "what-is-gamified-startup-execution",
    category: "startup-execution",
    title: "What Is Gamified Startup Execution?",
    description:
      "Gamified startup execution uses visible progress, milestones, constraints, and feedback to help founders keep moving through ambiguous early work.",
    readTime: "7 min read",
    publishedAt: sharedPublishedAt,
    updatedAt: sharedPublishedAt,
    sections: [
      {
        id: "not-points",
        heading: "Gamification is not points for busywork",
        body: [
          "Bad gamification rewards activity that looks productive. Good gamified execution makes the right work easier to see and harder to avoid. In startups, that difference is enormous.",
          "A founder can spend weeks naming features, collecting inspiration, and adjusting copy without confronting the riskiest assumption. A better system nudges the founder toward concrete progress: define the user, test the pain, build the smallest proof, recruit a collaborator, close an open loop.",
          "The goal is not to make startup work feel like a game. The goal is to borrow the parts of games that help humans persist through difficulty: clear goals, immediate feedback, visible state, and meaningful progression.",
        ],
      },
      {
        id: "ambiguity",
        heading: "Early execution fails because the work is ambiguous",
        body: [
          "A mature company can assign tasks against a known operating model. Early founders do not have that luxury. They are often deciding what the work even is while doing it. That ambiguity creates avoidance. When every task feels equally important, founders drift toward the task with the least emotional risk.",
          "Gamified execution can reduce ambiguity by turning venture-building into stages. The stages do not guarantee success, but they give founders a way to locate themselves. Are we exploring the problem? Testing demand? Recruiting help? Building proof? Preparing launch? Different stages demand different behavior.",
        ],
      },
      {
        id: "signals",
        heading: "The useful signals are earned",
        body: [
          "A progress system should reward signals that matter. Completing a profile is not the same as validating a problem. Writing a pitch is not the same as learning why users resist adoption. Inviting collaborators is not the same as coordinating contribution.",
          "Useful gamified systems distinguish between surface activity and venture progress. They make it satisfying to finish the awkward work: asking sharper questions, shipping rough prototypes, documenting decisions, and returning to the idea after feedback makes it less comfortable.",
        ],
      },
    ],
  },
  {
    slug: "why-most-startup-ideas-die-before-launch",
    category: "startup-execution",
    title: "Why Most Startup Ideas Die Before Launch",
    description:
      "Startup ideas often die before launch because founders lose momentum, avoid the hard test, or never turn the idea into a repeatable execution loop.",
    readTime: "8 min read",
    publishedAt: sharedPublishedAt,
    updatedAt: sharedPublishedAt,
    sections: [
      {
        id: "quiet-failure",
        heading: "Most startup ideas do not fail loudly",
        body: [
          "The common story of startup failure is dramatic: a launch goes badly, a competitor wins, funding disappears, customers reject the product. But many ideas never reach the stage where failure becomes visible. They fade before launch.",
          "This kind of failure is quieter and more common in early founder communities. The idea begins with energy, attracts a few encouraging comments, maybe gets a logo or a landing page, and then stops. No one declares it dead. It just becomes something the founder used to talk about.",
        ],
      },
      {
        id: "momentum",
        heading: "The momentum gap is real",
        body: [
          "The first week of a new idea is powered by imagination. The second month requires systems. Without a way to define progress, founders depend on mood, free time, and confidence. Those are unstable operating assets.",
          "Execution needs a structure that survives the emotional dip. That structure can be simple: a small backlog, a next experiment, a collaborator, a visible milestone, and a way to record what was learned. The point is to make the next step available before motivation has to invent it again.",
        ],
      },
      {
        id: "hard-test",
        heading: "Founders delay the test that can hurt them",
        body: [
          "Every idea has a test the founder secretly knows will matter. Will users care enough to switch? Will anyone pay? Can the team build the hard part? Does the audience exist outside the founder's circle? The idea often stalls because that test is emotionally expensive.",
          "Avoidance can look productive. Research expands. The roadmap grows. The brand improves. The founder gathers advice from people who cannot reject the product because they are not the target user. Progress becomes safer and less useful.",
        ],
      },
    ],
  },
  {
    slug: "how-to-find-cofounders-online",
    category: "founder-collaboration",
    title: "How to Find Cofounders Online",
    description:
      "Finding cofounders online works best when founders reveal how they build, make contribution visible, and test collaboration before making promises.",
    readTime: "8 min read",
    publishedAt: sharedPublishedAt,
    updatedAt: sharedPublishedAt,
    sections: [
      {
        id: "wrong-search",
        heading: "The wrong way to search for a cofounder",
        body: [
          "Many cofounder searches start with a job description disguised as a partnership offer. A founder says they need a technical cofounder, a growth cofounder, or someone who can help build the product. That may be true, but it is not enough.",
          "A serious collaborator is not only evaluating the idea. They are evaluating the founder's clarity, pace, judgment, and willingness to do uncomfortable work. Online cofounder discovery works when those qualities are visible before the first call.",
        ],
      },
      {
        id: "show-work",
        heading: "Show the work, not just the ambition",
        body: [
          "The best way to attract a cofounder online is to make the venture's current state legible. What problem are you attacking? What have you tried? Where are you stuck? Which assumptions are unresolved? What kind of contribution would change the trajectory?",
          "This is more persuasive than a polished pitch because it gives a potential collaborator something to inspect. Strong founders are attracted to motion, not perfection. They want to see that the idea has enough structure to join and enough uncertainty to shape.",
        ],
      },
      {
        id: "test",
        heading: "Test collaboration before commitment",
        body: [
          "A cofounder relationship should not begin with a title. It should begin with work. Small collaboration tests reveal more than long alignment calls: can you disagree clearly, make decisions, handle ambiguity, and return with useful progress?",
          "Try a bounded sprint. Define one problem, one output, one time window, and one decision at the end. This protects both people from prematurely turning enthusiasm into equity conversations.",
        ],
      },
    ],
  },
  {
    slug: "how-founder-collaboration-actually-works",
    category: "founder-collaboration",
    title: "How Founder Collaboration Actually Works",
    description:
      "Founder collaboration works through shared context, clear contribution, conflict hygiene, and repeated execution, not vague networking energy.",
    readTime: "7 min read",
    publishedAt: sharedPublishedAt,
    updatedAt: sharedPublishedAt,
    sections: [
      {
        id: "not-networking",
        heading: "Founder collaboration is not networking",
        body: [
          "Networking creates contact. Collaboration creates output. The difference sounds obvious until you watch early startup communities reward visibility more than contribution.",
          "Real founder collaboration begins when people share enough context to improve the work. A useful collaborator does not merely say the idea is interesting. They make the idea sharper, expose a risk, build a piece, introduce a relevant user, or help convert confusion into a next step.",
        ],
      },
      {
        id: "context",
        heading: "Shared context is the operating system",
        body: [
          "Collaboration breaks when context lives in private messages, old calls, and the founder's head. New contributors cannot help because they cannot see the current state of the venture.",
          "A collaborative founder keeps the work understandable. They document decisions, name open questions, and make progress visible. This does not need to be bureaucratic. It needs to be clear enough that someone skilled can enter the work without starting from zero.",
        ],
      },
      {
        id: "trust",
        heading: "Trust comes from repeated work",
        body: [
          "Trust is not built by alignment language. It is built when people do what they said, communicate when blocked, and make the venture better over multiple cycles.",
          "Interactive Ideas is designed to make that repeated work more visible. Founders can move beyond one-off feedback and start seeing who actually contributes to the life of an idea.",
        ],
      },
    ],
  },
  {
    slug: "what-is-open-entrepreneurship",
    category: "open-innovation",
    title: "What Is Open Entrepreneurship?",
    description:
      "Open entrepreneurship is a more participatory model of startup creation where ideas, problems, and contribution can develop in public without exposing the whole company.",
    readTime: "8 min read",
    publishedAt: sharedPublishedAt,
    updatedAt: sharedPublishedAt,
    sections: [
      {
        id: "definition",
        heading: "Open entrepreneurship is not careless transparency",
        body: [
          "Open entrepreneurship does not mean publishing every secret or turning a startup into a public committee. It means recognizing that early venture creation benefits from selective openness: exposing problems, assumptions, and contribution opportunities before the company is fully formed.",
          "The old model tells founders to hide the idea until it is defensible. The more useful model asks what parts of the idea become stronger when the right people can see them.",
        ],
      },
      {
        id: "why-open",
        heading: "Why openness can improve early ideas",
        body: [
          "Early ideas are usually under-informed. Founders have partial context, uneven access to users, and limited perspectives on feasibility. Selective openness increases the surface area for useful collision.",
          "Someone may recognize a hidden customer segment. Another person may point out a broken assumption. A builder may see a simpler prototype path. A future collaborator may notice the exact place their skill can matter.",
        ],
      },
      {
        id: "boundaries",
        heading: "The boundary matters",
        body: [
          "Open entrepreneurship needs boundaries. Platform content, private user data, internal strategy, and sensitive venture work should not be exposed by default. Founders need control over what is public, what is shared with collaborators, and what stays private.",
          "For Interactive Ideas, that boundary is central. Public SEO content can teach the philosophy of venture-building while the actual platform content remains protected behind auth until there is an explicit reason to make more of it public.",
        ],
      },
    ],
  },
  {
    slug: "how-crowdsolving-can-build-better-startups",
    category: "open-innovation",
    title: "How Crowdsolving Can Build Better Startups",
    description:
      "Crowdsolving helps startup founders improve ideas by turning communities into focused problem-solving systems instead of passive audiences.",
    readTime: "7 min read",
    publishedAt: sharedPublishedAt,
    updatedAt: sharedPublishedAt,
    sections: [
      {
        id: "not-opinions",
        heading: "Crowdsolving is not asking everyone for opinions",
        body: [
          "A crowd can make an idea worse if the founder treats every opinion equally. Crowdsolving is different. It is the deliberate use of distributed perspective to solve specific venture problems.",
          "The founder does not ask, Is this a good idea? That question invites vague encouragement and personal preference. The founder asks sharper questions: where would this fail, who has this pain, what workaround exists, which part is hardest to adopt?",
        ],
      },
      {
        id: "focused",
        heading: "Good crowdsolving starts with a focused problem",
        body: [
          "The narrower the problem, the better the contribution. A broad startup idea creates broad commentary. A focused challenge gives people a way to apply lived experience, technical knowledge, customer insight, or operational judgment.",
          "For example, a founder building a tool for local service businesses should not only ask whether the product is useful. They might ask how owners currently handle missed appointments, what makes staff resist new software, or which workflow step creates the most hidden cost.",
        ],
      },
      {
        id: "work",
        heading: "Contribution must turn into work",
        body: [
          "Crowdsolving has value only if answers change the venture. The founder needs a way to convert comments into decisions, experiments, collaborators, or tasks. Otherwise the process becomes another form of content engagement.",
          "This is where a venture platform can outperform a social feed. It can preserve context, connect contributors to action, and show how the idea changed after the crowd helped solve a problem.",
        ],
      },
    ],
  },
  {
    slug: "the-future-of-collaborative-venture-building",
    category: "future-of-entrepreneurship",
    title: "The Future of Collaborative Venture Building",
    description:
      "Collaborative venture building will make startup creation more networked, contribution-driven, and transparent without turning every idea into public property.",
    readTime: "8 min read",
    publishedAt: sharedPublishedAt,
    updatedAt: sharedPublishedAt,
    sections: [
      {
        id: "myth",
        heading: "The lone-founder myth is getting less useful",
        body: [
          "The story of entrepreneurship still over-indexes on the solitary genius. It is a compelling story and a poor operating model. Most ventures are shaped by a network of feedback, labor, trust, introductions, customer insight, and repeated decisions under uncertainty.",
          "The future of venture building will make that network more explicit. Instead of pretending companies appear fully formed from private conviction, founders will use systems that help ideas gather the right contribution earlier.",
        ],
      },
      {
        id: "networked",
        heading: "Venture building becomes more networked",
        body: [
          "Networked venture building does not mean everyone works on everything. It means the right people can discover the right unfinished work. A founder can reveal a problem, a collaborator can contribute, and the venture can move without requiring a warm intro or a formal accelerator gate.",
          "This changes who gets to participate. Talent that sits outside traditional startup networks can become visible through contribution, not credentials alone.",
        ],
      },
      {
        id: "human",
        heading: "The human layer becomes more important",
        body: [
          "AI will automate pieces of startup creation, but it will also make human judgment more valuable. When drafts, prototypes, and research become cheaper, the scarce skill becomes knowing what to build, who to build with, and which evidence should change the plan.",
          "Collaborative venture building is the answer to that scarcity. It gives founders more judgment around the idea before the market delivers the expensive version of the lesson.",
        ],
      },
    ],
  },
  {
    slug: "how-ai-will-change-startup-creation",
    category: "future-of-entrepreneurship",
    title: "How AI Will Change Startup Creation",
    description:
      "AI will make startup creation faster, but the biggest shift will be how founders test ideas, coordinate collaborators, and turn generated output into judgment.",
    readTime: "9 min read",
    publishedAt: sharedPublishedAt,
    updatedAt: sharedPublishedAt,
    sections: [
      {
        id: "cheap-drafts",
        heading: "AI makes the first draft cheap",
        body: [
          "AI changes startup creation by making many first drafts cheap: landing pages, product concepts, research summaries, code prototypes, user interview scripts, positioning options, and competitive maps. This is useful, but it also creates a trap.",
          "When output becomes easy, founders can confuse volume with progress. A stack of generated artifacts can make an idea feel advanced before the founder has tested whether anyone cares.",
        ],
      },
      {
        id: "judgment",
        heading: "The scarce resource becomes judgment",
        body: [
          "The founder's advantage shifts from producing everything manually to choosing what deserves attention. Which assumption matters? Which user segment is real? Which prototype should be tested? Which answer is plausible but unsupported?",
          "AI can accelerate the loop, but it should not replace the loop. Startup creation still requires contact with reality: users, collaborators, constraints, and behavior.",
        ],
      },
      {
        id: "collaboration",
        heading: "AI will make collaboration more necessary",
        body: [
          "This sounds counterintuitive. If AI gives founders more leverage, why need more collaboration? Because leverage increases the cost of bad direction. A founder can now move quickly down the wrong path with impressive artifacts.",
          "Collaborators help challenge direction. They ask whether the generated research matches lived experience, whether the prototype solves the real workflow, and whether the founder is avoiding the hardest test.",
        ],
      },
      {
        id: "execution",
        heading: "AI output has to connect to execution",
        body: [
          "The useful future is not an AI that writes a startup plan and leaves the founder alone with a document. The useful future connects AI output to execution: tasks, experiments, collaborator requests, progress tracking, and learning.",
          "Interactive Ideas is positioned around that broader shift. The point is not merely to generate more ideas. It is to help founders move from idea to venture with more structure, more collaboration, and better judgment at every step.",
        ],
      },
    ],
  },
];

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getCategoryArticles(categorySlug: CategorySlug) {
  return articles.filter((article) => article.category === categorySlug);
}

export function getArticle(categorySlug: string, articleSlug: string) {
  return articles.find(
    (article) => article.category === categorySlug && article.slug === articleSlug,
  );
}

export function getRelatedArticles(article: Article, limit = 3) {
  const sameCategory = articles.filter(
    (candidate) =>
      candidate.category === article.category && candidate.slug !== article.slug,
  );
  const otherCategories = articles.filter(
    (candidate) => candidate.category !== article.category,
  );

  return [...sameCategory, ...otherCategories].slice(0, limit);
}

export function articlePath(article: Pick<Article, "category" | "slug">) {
  return `/${article.category}/${article.slug}`;
}

export function categoryPath(category: Pick<Category, "slug">) {
  return `/${category.slug}`;
}

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path}`;
}
