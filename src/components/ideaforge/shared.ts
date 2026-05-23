export const cardSurface =
  "rounded-[16px] border border-white/[0.07] bg-[#111827]/92 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl";
export const transitionBase = "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]";
export const displayFontClass = "[font-family:var(--font-display)]";
export const codeFontClass = "[font-family:var(--font-code)]";
export const shellMax = "mx-auto w-full max-w-[1440px]";

export const composerCategories = ["SaaS", "AI", "Climate", "Fintech", "Creator Tools", "HealthTech"];
export const stageOptions = ["Concept", "Validated", "MVP", "Launched"];
export const industryOptions = [
  "Chemicals",
  "Metals and Mining",
  "Automobiles and Private Transportation",
  "Public Transportation",
  "Media and Entertainment",
  "Travel, Tourism, and Hospitality",
  "Household Goods and Appliances",
  "Consumer Electronics",
  "Food, Beverage, Tobacco, and Consumables",
  "Healthcare and Life Sciences",
  "Energy",
  "Finance",
  "Aerospace and Aviation",
  "Defence and Security",
  "Construction and Building Materials",
  "Manufacturing (General)",
  "Industrial Equipment and Services",
  "Real Estate",
  "Telecommunications",
  "Software and Technology",
  "Utilities",
  "Agriculture and Natural Resources",
  "Labour and Workforce",
  "Corporate and Management Services",
  "Sales and Marketing",
  "Professional Services",
  "Environmental and Social Impact",
  "Education and Academia",
  "Retail and Commerce",
  "Logistics and Supply Chain",
  "Textiles and Apparel",
  "Sports Industry",
  "Religious and Cultural Institutions",
  "Government and Public Administration",
  "Research and Development",
  "Security and Risk Management",
  "Space Economy",
  "Creator Economy",
  "Pet Industry",
  "Luxury Industry",
];

export const skillOptions = [
  "Physical Sciences",
  "Life Sciences",
  "Earth and Environmental Sciences",
  "Space Sciences",
  "Interdisciplinary Sciences",
  "Software and Computing",
  "Electronics and Electrical",
  "Mechanical and Industrial",
  "Aerospace and Transport Engineering",
  "Infrastructure Engineering",
  "Specialized Engineering",
  "Pure Mathematics",
  "Applied Mathematics",
  "Statistics",
  "Mathematical Modeling",
  "Architecture",
  "Interior Design",
  "Urban Planning",
  "Visual Arts",
  "Media Arts",
  "Performing Arts",
  "Music",
  "Design",
  "Animation and Games",
  "Literary Arts",
  "Social Sciences",
  "Psychology",
  "Cultural Studies",
  "Historical Studies",
  "Philosophy",
  "Finance",
  "Accounting",
  "Management",
  "Marketing",
  "Entrepreneurship",
  "Corporate Law",
  "Criminal Law",
  "International Law",
  "Teaching",
  "Curriculum Design",
  "Academic Research",
  "Clinical Medicine",
  "Surgery",
  "Public Health",
  "Nursing",
  "Hotel Management",
  "Culinary Arts",
  "Tourism Operations",
  "Consulting",
  "Recruitment and HR",
  "Event Management",
  "Social Work",
  "NGO Management",
  "Public Policy",
  "Public Speaking",
  "Negotiation",
  "Storytelling",
  "Leadership",
  "Strategic Thinking",
  "Team Management",
  "Sports",
  "Fitness",
  "Sports Coaching",
  "Military Strategy",
  "Construction Trades",
  "Mechanical Trades",
  "Traditional Crafts",
  "Farming",
  "Animal Husbandry",
  "Forestry",
  "Supply Chain Planning",
  "Logistics Management",
  "Warehouse Management",
  "Critical Thinking",
  "Problem Solving",
  "Creativity",
  "Emotional Intelligence",
  "Social Media Management",
  "Content Creation",
  "E-commerce Operations",
  "Governance",
  "Political Campaigning",
  "Diplomacy",
  "Theology",
  "Religious Leadership",
  "Navigation",
  "Wilderness Survival",
  "Disaster Response",
];
export const feedTabs = [
  { key: "for-you", label: "For You" },
  { key: "latest", label: "Latest" },
  { key: "hot", label: "Hot This Week" },
  { key: "following", label: "Following" },
] as const;
export const myIdeaTabs = [
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
  { key: "analytics", label: "Analytics" },
] as const;

export type FeedTabKey = (typeof feedTabs)[number]["key"];
export type MyIdeasTabKey = (typeof myIdeaTabs)[number]["key"];
export type ViewMode = "grid" | "list";

export type IdeaAuthor = {
  _id?: string;
  displayName?: string;
  name?: string;
  username?: string;
  avatar?: string;
  role?: string;
};

export type IdeaForgeIdea = {
  _id: string;
  title: string;
  description: string;
  category: string;
  visibility: string;
  sparkCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  industries?: string;
  attachments?: { name: string; type: string; size: number; url: string; fileId: string }[];
  author?: IdeaAuthor | null;
  contributionCount?: number;
  activeContributions?: number;
};

export type CurrentUserProfile = {
  _id: string;
  clerkId?: string;
  username: string;
  displayName: string;
  avatar?: string;
  role?: string;
  skills?: string[];
  industries?: string[];
  industry?: string;
  xp?: number;
  level?: number;
  followersCount?: number;
  followingCount?: number;
};

export type BuilderSuggestion = {
  _id?: string;
  id?: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  skills?: string[];
};

export interface ComposerDraft {
  title: string;
  description: string;
  tags: string[];
  category: string;
  stage: string;
  industries: string[];
  visibility: "public" | "private";
}

export function getInitials(name?: string) {
  if (!name) return "IF";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function parseTags(tagStr?: string) {
  if (!tagStr) return [] as string[];
  try {
    const parsed = JSON.parse(tagStr);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => String(entry).trim()).filter(Boolean);
    }
  } catch {
    // Ignore JSON parse errors and fall back to CSV parsing.
  }
  return tagStr
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getDisplayName(author?: IdeaAuthor | null) {
  return author?.displayName || author?.name || author?.username || "InteractiveIdeas Builder";
}

export function getRoleBadge(author?: IdeaAuthor | null) {
  const rawRole = (author?.role || "").toLowerCase();
  if (rawRole.includes("admin")) return "AI Curator";
  if (rawRole.includes("moderator")) return "Founder";
  return "Builder";
}

export function getIdeaStage(idea: IdeaForgeIdea) {
  if (idea.visibility === "private") return "Concept Stage";
  if ((idea.sparkCount || 0) >= 12) return "Validated";
  if ((idea.attachments || []).length > 0) return "MVP Ready";
  return "Concept Stage";
}

export function getReadTime(description: string) {
  const words = description.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 120))} min read`;
}

export function getBannerImage(idea: IdeaForgeIdea) {
  return Array.isArray(idea.attachments)
    ? idea.attachments.find((item) => (item.type || "").toLowerCase().startsWith("image/"))?.url
    : undefined;
}

export function matchesSearch(idea: IdeaForgeIdea, searchQuery: string) {
  if (!searchQuery.trim()) return true;
  const needle = searchQuery.toLowerCase();
  const haystack = [
    idea.title,
    idea.description,
    idea.category,
    idea.industries,
    idea.author?.name,
    idea.author?.displayName,
    idea.author?.username,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

