"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Eye, Trash2, Pencil, Check, Plus, X, Lightbulb, Menu } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation, useQuery } from "convex/react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import Image from "next/image";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";
import { InvitationSection } from "@/components/requests/invitation-section";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { ContributionDashboard } from "@/components/requests/ContributionDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeNodeContent,
  TreeExpander,
  TreeIcon,
  TreeLabel,
} from "@/components/ui/kibo-ui/tree";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
  TaskEditDialog,
} from "@/components/ui/kibo-ui/kanban";
import PdfViewer from "@/components/PdfViewer";
import ExcelViewer from "@/components/ExcelViewer";
import WordViewer from "@/components/WordViewer";
import PowerPointViewer from "@/components/PowerPointViewer";
import { IdeaSideNav } from "@/components/IdeaSideNav";
import { IdeaBottomBar } from "@/components/IdeaBottomBar";
import { CreateSubIdeaDialog } from "@/components/ideas/CreateSubIdeaDialog";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
import { IdeaBreadcrumb, IdeaHierarchyFlowchart } from "@/components/idea/IdeaHierarchyNav";

type ConvexIdea = {
  _id: string;
  title: string;
  description: string;
  category: string;
  industries?: string;
  visibility: string;
  sparkCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  author?: { _id: string; name?: string; username?: string; avatar?: string } | null;
  hasSparked?: boolean;
  isAuthor?: boolean;
  attachments?: { name: string; type: string; size: number; url: string; fileId: string }[];
};

type TreeNode = {
  _id: string;
  title: string;
  description: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  isDeleted?: boolean;
  author?: { _id: string; name?: string; username?: string };
  children?: TreeNode[];
  childrenCount: number;
};

type Todo = {
  _id: Id<"todos">;
  title: string;
  status: "todo" | "in_progress" | "done";
  createdAt: number;
  updatedAt: number;
  order?: number;
  authorId: string;
  ideaId: string;
  assignedTo?: { _id: string; name: string; username: string; avatar?: string } | null;
  deadline?: number;
  completionTarget?: string;
  author?: { _id: string; name?: string; username?: string; avatar?: string } | null;
  canEdit?: boolean;
  canDelete?: boolean;
};

function parseCategoryDisplay(raw?: string): string {
  if (!raw) return "";
  let items: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) items = parsed.map((s) => String(s).trim()).filter(Boolean);
  } catch {
    items = raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]}, ${items[1]}`;
  return `${items[0]}, ${items[1]} (+${items.length - 2} more)`;
}

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;

  const ideaQuery = useQuery(api.ideas.getIdeaById, { ideaId: id as Id<"ideas"> });
  const ideaTreeQuery = useQuery(api.ideas.getIdeaTree, { rootIdeaId: id as Id<"ideas"> });
  const addSubIdeaMutation = useMutation(api.ideas.addSubIdea);
  const userRequestsQuery = useQuery(api.contributionRequests.getMyRequests);
  const todosQuery = useQuery(api.todos.getTodosForIdea, { ideaId: id as Id<"ideas"> });
  const createTodoMutation = useMutation(api.todos.createTodo);
  const updateTodoMutation = useMutation(api.todos.updateTodo);
  const updateTodoStatusMutation = useMutation(api.todos.updateTodoStatus);
  const deleteTodoMutation = useMutation(api.todos.deleteTodo);

  const [showHierarchy, setShowHierarchy] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCreateSubIdea, setShowCreateSubIdea] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    if (isLoaded && !userId) router.push("/");
  }, [isLoaded, userId, router]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && isLoaded && userId) {
      const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash === "#hierarchy") {
          setShowHierarchy(true);
        } else if (hash === "#contributors") {
          setShowRequests(true);
        }
      };

      handleHashChange();

      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, [isLoaded, userId]);

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Spinner size={40} />
        </main>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenHierarchy={() => setShowHierarchy(true)}
        onOpenTodos={() => setShowTodos(true)}
        onOpenCalendar={() => setShowCalendar(true)}
      />

      <main className="flex-1 w-full py-12 pt-24 lg:pr-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Breadcrumb — always shows Feed > root > ... > current so
              the user never loses context. */}
          <IdeaBreadcrumb ideaId={id as Id<"ideas">} className="mb-3" />

          {/* Desktop: persistent right rail — pulled ~3-4 cm in from the right edge */}
          <div className="hidden lg:block">
            <IdeaSideNav
              className="fixed right-32 top-1/2 -translate-y-1/2 z-40 rounded-2xl border border-white/10 bg-[#0F1726]/95 backdrop-blur-xl p-2 shadow-[0_18px_44px_rgba(3,7,18,0.55)]"
              onOpenHierarchy={() => setShowHierarchy(true)}
              onOpenTodos={() => setShowTodos(true)}
              onOpenCalendar={() => setShowCalendar(true)}
              todoCount={todosQuery?.filter((t) => t.status !== "done").length || 0}
              ideaId={id}
              isContributor={ideaQuery?.isAuthor || userRequestsQuery?.some((r) => r.ideaId === id && r.status === "accepted")}
              onCreateSubIdea={() => setShowCreateSubIdea(true)}
            />
          </div>

          {/* Mobile: hamburger menu anchored just below navbar profile icon (top-right). Click → opens side rail popover. */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Open idea actions"
                className="lg:hidden fixed top-[60px] right-3 z-40 inline-flex h-8 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground border border-white/10 hover:bg-primary/90 active:scale-95 transition-colors"
              >
                <Menu className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="w-auto p-1.5 rounded-2xl border border-white/10 bg-[#0F1726]/95 backdrop-blur-xl shadow-[0_18px_44px_rgba(3,7,18,0.55)]"
            >
              <IdeaSideNav
                onOpenHierarchy={() => setShowHierarchy(true)}
                onOpenTodos={() => setShowTodos(true)}
                onOpenCalendar={() => setShowCalendar(true)}
                todoCount={todosQuery?.filter((t) => t.status !== "done").length || 0}
                ideaId={id}
                isContributor={ideaQuery?.isAuthor || userRequestsQuery?.some((r) => r.ideaId === id && r.status === "accepted")}
                onCreateSubIdea={() => setShowCreateSubIdea(true)}
              />
            </PopoverContent>
          </Popover>

          {/* Floating chat button — same as community page */}
          <FloatingChatButton />

          {ideaQuery === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={48} />
              <p className="ml-4 text-muted-foreground">Loading idea...</p>
            </div>
          ) : ideaQuery === null ? (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Idea Not Found</h2>
              <p className="text-muted-foreground mb-6">The idea you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => router.push("/feed")}>Back to Feed</Button>
            </div>
          ) : (
            <>
              <div className="pb-8">
                <IdeaContent
                  idea={ideaQuery as ConvexIdea}
                  onTagClick={setSearchQuery}
                  onOpenComments={() => setShowComments(true)}
                  onOpenRequests={() => setShowRequests(true)}
                  requestCount={userRequestsQuery?.filter((r) => r.ideaId === ideaQuery._id && r.status === "pending").length || 0}
                />
              </div>

              <Dialog open={showHierarchy} onOpenChange={setShowHierarchy}>
                <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden w-full p-4 sm:p-6 flex flex-col">
                  <DialogHeader className="shrink-0">
                    <DialogTitle>Idea Hierarchy</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    {/* Flowchart of the full idea family with "You are
                        here" marker on the current node. Clicking any
                        node navigates to that idea. */}
                    <IdeaHierarchyFlowchart
                      ideaId={id as Id<"ideas">}
                      className="border-0 bg-transparent p-0"
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showRequests} onOpenChange={setShowRequests}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto w-full">
                  <DialogHeader>
                    <DialogTitle>Contribution Requests</DialogTitle>
                  </DialogHeader>
                  {(ideaQuery as ConvexIdea).isAuthor ? (
                    <Tabs defaultValue="incoming" className="w-full mt-2">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="incoming">Incoming Requests</TabsTrigger>
                        <TabsTrigger value="invite">Invite Contributors</TabsTrigger>
                      </TabsList>
                      <TabsContent value="incoming" className="mt-4">
                        <ContributionDashboard
                          ideaId={ideaQuery._id as Id<"ideas">}
                          ideaTitle={(ideaQuery as ConvexIdea).title}
                          authorId={(ideaQuery as ConvexIdea).authorId}
                          authorName={(ideaQuery as ConvexIdea).author?.name || (ideaQuery as ConvexIdea).author?.username}
                          isAuthor
                          onClose={() => setShowRequests(false)}
                          embedded
                        />
                      </TabsContent>
                      <TabsContent value="invite" className="mt-4">
                        <InvitationSection
                          idea={{ _id: ideaQuery._id as Id<"ideas">, isAuthor: true }}
                          embedded
                        />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <>
                      <ContributionDashboard
                        ideaId={ideaQuery._id as Id<"ideas">}
                        ideaTitle={(ideaQuery as ConvexIdea).title}
                        authorId={(ideaQuery as ConvexIdea).authorId}
                        authorName={(ideaQuery as ConvexIdea).author?.name || (ideaQuery as ConvexIdea).author?.username}
                        isAuthor={false}
                        onClose={() => setShowRequests(false)}
                      />
                      <InvitationSection idea={{ _id: ideaQuery._id as Id<"ideas">, isAuthor: false }} />
                    </>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog open={showTodos} onOpenChange={setShowTodos}>
                <DialogContent className="w-[calc(100vw-1rem)] max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl">
                  <DialogHeader className="px-4 sm:px-6 py-3 shrink-0 border-b">
                    <DialogTitle>Project Management</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <TodoSection
                      idea={ideaQuery as ConvexIdea}
                      todos={todosQuery || []}
                      createTodoMutation={createTodoMutation}
                      updateTodoMutation={updateTodoMutation}
                      updateTodoStatusMutation={updateTodoStatusMutation}
                      deleteTodoMutation={deleteTodoMutation}
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
                <DialogContent className="w-[calc(100vw-1rem)] max-w-5xl max-h-[90vh] overflow-hidden p-2 sm:p-6">
                  <DialogHeader>
                    <DialogTitle>Project Calendar</DialogTitle>
                  </DialogHeader>
                  <CalendarSection idea={ideaQuery as ConvexIdea} />
                </DialogContent>
              </Dialog>

              <Dialog open={showComments} onOpenChange={setShowComments}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-4 sm:p-6 w-full">
                  <DialogHeader>
                    <DialogTitle>Comments</DialogTitle>
                  </DialogHeader>
                  <CommentsSection ideaId={ideaQuery._id as Id<"ideas">} commentCount={(ideaQuery as ConvexIdea).commentCount} />
                </DialogContent>
              </Dialog>

              <CreateSubIdeaDialog
                isOpen={showCreateSubIdea}
                onOpenChange={setShowCreateSubIdea}
                parentId={ideaQuery._id as Id<"ideas">}
                addSubIdeaMutation={addSubIdeaMutation}
              />
            </>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}

const NodeTodoCount: React.FC<{ ideaId: Id<"ideas"> }> = ({ ideaId }) => {
  const todos = useQuery(api.todos.getTodosForIdea, { ideaId }) || [];
  if (todos.length === 0) return null;
  const done = todos.filter((t) => t.status === "done").length;
  const total = todos.length;
  const allDone = done === total;
  return (
    <span
      className={cn(
        "shrink-0 ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        allDone
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          : "border-amber-500/30 bg-amber-500/10 text-amber-600"
      )}
      title={`${done} of ${total} todos completed`}
    >
      <Check className="w-3 h-3" />
      {done}/{total}
    </span>
  );
};

const NodeTodoList: React.FC<{ ideaId: Id<"ideas"> }> = ({ ideaId }) => {
  const todos = useQuery(api.todos.getTodosForIdea, { ideaId });
  if (todos === undefined) return <div className="text-xs text-muted-foreground italic px-1">Loading todos…</div>;
  if (todos.length === 0) return <div className="text-xs text-muted-foreground italic px-1">No todos yet for this idea.</div>;
  const order = { in_progress: 0, todo: 1, done: 2 } as const;
  const sorted = [...todos].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Todos · {todos.length}</div>
      <ul className="space-y-1.5">
        {sorted.map((t) => (
          <li key={t._id} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor:
                  t.status === "done" ? "#22c55e" : t.status === "in_progress" ? "#3b82f6" : "#eab308",
              }}
            />
            <span className={cn("truncate flex-1", t.status === "done" && "line-through text-muted-foreground")}>{t.title}</span>
            {t.deadline && (
              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{format(new Date(t.deadline), "MMM dd")}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const IdeaContent: React.FC<{
  idea: ConvexIdea;
  onTagClick?: (tag: string) => void;
  onOpenComments: () => void;
  onOpenRequests: () => void;
  requestCount: number;
}> = ({ idea, onTagClick, onOpenComments, onOpenRequests, requestCount }) => {
  const router = useRouter();
  const updateIdeaMutation = useMutation(api.ideas.updateIdea);
  const deleteIdeaMutation = useMutation(api.ideas.deleteIdea);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(idea.title);
  const [editedDescription, setEditedDescription] = useState(idea.description);
  const [editedCategory, setEditedCategory] = useState(idea.category);
  const [editedVisibility, setEditedVisibility] = useState(idea.visibility);
  const [updating, setUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAllIndustries, setShowAllIndustries] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  const getInitials = (name: string) => name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

  const parseTags = (tagStr?: string): string[] => {
    if (!tagStr) return [];
    try {
      const parsed = JSON.parse(tagStr);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {}
    return tagStr.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const skills = parseTags(idea.category);
  const industries = parseTags(idea.industries);
  const displayedIndustries = showAllIndustries ? industries : industries.slice(0, 1);
  const displayedSkills = showAllSkills ? skills : skills.slice(0, 1);

  const handleEdit = () => {
    setEditedTitle(idea.title);
    setEditedDescription(idea.description);
    setEditedCategory(idea.category);
    setEditedVisibility(idea.visibility);
    setIsEditing(true);
    setErrorMsg("");
  };

  const handleSave = async () => {
    if (!editedTitle.trim() || !editedDescription.trim()) return;
    setUpdating(true);
    setErrorMsg("");
    try {
      await updateIdeaMutation({
        ideaId: idea._id as Id<"ideas">,
        title: editedTitle.trim(),
        description: editedDescription.trim(),
        category: editedCategory,
        visibility: editedVisibility,
      });
      setIsEditing(false);
    } catch (err) {
      setErrorMsg("Failed to update idea. Please try again.");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this idea? This action cannot be undone.")) return;
    setIsDeleting(true);
    setErrorMsg("");
    try {
      await deleteIdeaMutation({ ideaId: idea._id as Id<"ideas"> });
      router.push("/feed");
    } catch (err) {
      setErrorMsg("Failed to delete idea. Please try again.");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card text-card-foreground transition-all duration-300 flex flex-col shadow-xl">
      <div className="relative bg-gradient-to-br from-indigo-500/12 via-purple-500/10 to-pink-500/8 px-5 pt-5 pb-5 shrink-0 border-b border-border/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="text-2xl font-bold bg-background/80 backdrop-blur-md border-white/20 h-auto py-2" placeholder="Idea Title" />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-[1.15] break-words">{idea.title}</h1>
            )}
          </div>

          <Link href={`/profile/${idea.author?.username || idea.authorId}`} className="shrink-0 rounded-full transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
            {idea.author?.avatar ? (
              <Image src={idea.author.avatar} alt={idea.author?.name || idea.author?.username || "User"} className="w-11 h-11 rounded-full object-cover border-2 border-border/50 shadow-md" width={44} height={44} />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary border-2 border-border/50 shadow-md">
                {getInitials(idea.author?.name || idea.author?.username || "U")}
              </div>
            )}
          </Link>
        </div>
      </div>

      <div className="p-8 flex flex-col gap-8">
        <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
          {isEditing ? (
            <Textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="min-h-[200px] resize-y" placeholder="Describe your idea..." />
          ) : (
            <p className="whitespace-pre-wrap">{idea.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-6 border-t border-border/50">
          {/* Edit / Delete — top-right of tag block */}
          {(idea.isAuthor || false) && !isEditing && (
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={handleEdit}
                aria-label="Edit idea"
                title="Edit"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/70 border border-border/50 text-foreground/80 hover:bg-background hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Delete idea"
                title="Delete"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Spinner size={12} /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {/* Industries — own row */}
          {industries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {displayedIndustries.map((tag, i) => (
                <button key={`ind-${i}`} onClick={() => onTagClick?.(tag)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-pointer">{tag}</button>
              ))}
              {!showAllIndustries && industries.length > 1 && (
                <button onClick={() => setShowAllIndustries(true)} aria-label="Show all industries" className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Skills — own row */}
          {skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {displayedSkills.map((tag, i) => (
                <button key={`skill-${i}`} onClick={() => onTagClick?.(tag)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer">{tag}</button>
              ))}
              {!showAllSkills && skills.length > 1 && (
                <button onClick={() => setShowAllSkills(true)} aria-label="Show all skills" className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {((showAllIndustries && industries.length > 1) || (showAllSkills && skills.length > 1)) && (
            <div>
              <button onClick={() => { setShowAllIndustries(false); setShowAllSkills(false); }} className="text-xs font-medium px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">Show less</button>
            </div>
          )}
        </div>

        {Array.isArray(idea.attachments) && idea.attachments.length > 0 && (
          <div className="flex flex-col gap-4 pt-6 border-t border-border/50">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
              {idea.attachments.map((att, idx) => {
                const mime = (att.type || "").toLowerCase();
                const key = att.fileId || `${att.name}-${idx}`;
                if (mime.startsWith("image/")) {
                  return (
                    <a key={key} href={att.url} target="_blank" rel="noreferrer" aria-label={`Open ${att.name}`} className="block">
                      <img src={att.url} alt={att.name} className="w-full max-h-[75vh] object-contain rounded-xl" />
                    </a>
                  );
                }
                if (mime.startsWith("video/") || mime.includes("mp4")) {
                  return (
                    <video key={key} src={att.url} className="w-full max-h-[75vh] rounded-xl" controls autoPlay muted loop playsInline preload="metadata" />
                  );
                }
                if (mime.includes("pdf")) return <div key={key} className="rounded-xl border bg-muted/30 p-4"><PdfViewer url={att.url} fileName={att.name} /></div>;
                if (mime.includes("word") || mime.includes("msword") || mime.includes("officedocument.wordprocessingml.document")) return <div key={key} className="rounded-xl border bg-muted/30 p-4"><WordViewer url={att.url} fileName={att.name} /></div>;
                if (mime.includes("excel") || mime.includes("spreadsheetml") || mime.includes("ms-excel") || mime.includes("officedocument.spreadsheetml.sheet")) return <div key={key} className="rounded-xl border bg-muted/30 p-4"><ExcelViewer url={att.url} fileName={att.name} /></div>;
                if (mime.includes("powerpoint") || mime.includes("presentationml") || mime.includes("ms-powerpoint") || mime.includes("officedocument.presentationml.presentation")) return <div key={key} className="rounded-xl border bg-muted/30 p-4"><PowerPointViewer url={att.url} fileName={att.name} /></div>;
                return (
                  <div key={key} className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-2 mb-2 text-xs"><span>{att.name}</span><a href={att.url} target="_blank" rel="noreferrer" className="underline">Open</a></div>
                    <div className="text-sm text-muted-foreground">Preview not available for this file type.</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isEditing && (
          <div className="flex items-center gap-4 pt-4 border-t border-border/50">
            <Button onClick={handleSave} disabled={updating}>{updating ? <div className="mr-2"><Spinner size={16} /></div> : <Check className="w-4 h-4 mr-2" />}Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={updating}><X className="w-4 h-4 mr-2" />Cancel</Button>
            {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}
          </div>
        )}

        <IdeaBottomBar
          ideaId={idea._id}
          initialSparkCount={idea.sparkCount}
          initialHasSparked={idea.hasSparked || false}
          commentCount={idea.commentCount}
          onOpenComments={onOpenComments}
          onOpenRequests={onOpenRequests}
          isAuthor={idea.isAuthor || false}
          requestCount={requestCount}
          variant="inline"
        />
      </div>
    </div>
  );
};

const TodoSection: React.FC<{
  idea: ConvexIdea;
  todos: Todo[];
  createTodoMutation: (args: { ideaId: Id<"ideas">; title: string; assignedTo?: Id<"users">; deadline?: number; completionTarget?: string }) => Promise<{ todoId: string; message: string }>;
  updateTodoMutation: (args: { todoId: Id<"todos">; title: string }) => Promise<{ message: string }>;
  updateTodoStatusMutation: (args: { todoId: Id<"todos">; status: "todo" | "in_progress" | "done" }) => Promise<{ status: "todo" | "in_progress" | "done"; message: string }>;
  deleteTodoMutation: (args: { todoId: Id<"todos"> }) => Promise<{ message: string }>;
}> = ({ idea, todos, createTodoMutation, updateTodoMutation, updateTodoStatusMutation, deleteTodoMutation }) => {
  const { userId } = useAuth();
  const [isCreateTodoDialogOpen, setIsCreateTodoDialogOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoAssignee, setNewTodoAssignee] = useState<string>("unassigned");
  const [newTodoDeadline, setNewTodoDeadline] = useState<Date | undefined>();
  const [newTodoCompletionTarget, setNewTodoCompletionTarget] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [todoToDelete, setTodoToDelete] = useState<Id<"todos"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Lifted edit-dialog state — owns ONE Dialog at the top level rather
  // than one Dialog per KanbanCard, which fixes the "edit button does
  // nothing" bug caused by nested Radix Dialogs inside the Project
  // Management Dialog.
  const [editingTodoId, setEditingTodoId] = useState<Id<"todos"> | null>(null);
  const updateTodoFull = useMutation(api.todos.updateTodo);

  const isAuthor = idea.isAuthor || false;
  const hasAcceptedContribution = useQuery(api.contributionRequests.getMyRequests)?.find((req) => req.ideaId === idea._id && req.status === "accepted");
  const canManageTodos = userId && (isAuthor || hasAcceptedContribution);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || isCreating) return;
    setIsCreating(true);
    setError("");
    try {
      await createTodoMutation({
        ideaId: idea._id as Id<"ideas">,
        title: newTodoTitle.trim(),
        assignedTo: newTodoAssignee !== "unassigned" ? (newTodoAssignee as Id<"users">) : undefined,
        deadline: newTodoDeadline ? newTodoDeadline.getTime() : undefined,
        completionTarget: newTodoCompletionTarget.trim() || undefined,
      });
      setNewTodoTitle("");
      setNewTodoAssignee("unassigned");
      setNewTodoDeadline(undefined);
      setNewTodoCompletionTarget("");
      setIsCreateTodoDialogOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create todo");
    } finally {
      setIsCreating(false);
    }
  };

  const allUsers = useQuery(api.users.getAllUsers) || [];
  const acceptedRequests = useQuery(api.contributionRequests.getAcceptedContributors, { ideaId: idea._id as Id<"ideas"> }) || [];
  const contributors = allUsers.filter((u) => u._id === idea.authorId || acceptedRequests.some((req) => req.userId === u._id)).map((u) => ({ _id: u._id, clerkId: u.clerkId, username: u.username, displayName: u.displayName, avatar: u.avatar }));

  const confirmDeleteTodo = async () => {
    if (!todoToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTodoMutation({ todoId: todoToDelete });
      setTodoToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const groupedTodos = todos?.reduce((acc, todo) => {
    if (todo.status === "todo") acc.todo.push(todo);
    else if (todo.status === "in_progress") acc.in_progress.push(todo);
    else acc.done.push(todo);
    return acc;
  }, { todo: [] as Todo[], in_progress: [] as Todo[], done: [] as Todo[] }) || { todo: [], in_progress: [], done: [] };

  const kanbanColumns = [{ id: "todo", name: "Todo" }, { id: "in_progress", name: "In Progress" }, { id: "done", name: "Done" }];
  const kanbanData = todos?.map((todo) => ({ id: todo._id as string, name: todo.title, column: todo.status, assignedTo: todo.assignedTo || undefined, deadline: todo.deadline, completionTarget: todo.completionTarget, canDelete: todo.canDelete || false })) || [];

  const handleDataChange = async (newData: typeof kanbanData) => {
    const currentTodos = todos || [];
    for (const item of newData) {
      const existing = currentTodos.find((t) => t._id === item.id);
      if (existing && existing.status !== item.column) {
        try {
          await updateTodoStatusMutation({ todoId: item.id as Id<"todos">, status: item.column as "todo" | "in_progress" | "done" });
        } catch (err) { console.error(err); }
        break;
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-5 overflow-y-auto">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-base font-semibold">Kanban Board</h3>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full border border-border/50">
              <Check className="w-3.5 h-3.5" /><span>{groupedTodos.done.length} done</span><span className="mx-1 opacity-30">•</span><span>{groupedTodos.in_progress.length} in progress</span><span className="mx-1 opacity-30">•</span><span>{groupedTodos.todo.length} todo</span>
            </div>
            {canManageTodos && (
              <Button
                onClick={() => setIsCreateTodoDialogOpen(true)}
                size="icon"
                aria-label="Add todo"
                title="Add todo"
                className="h-8 w-8"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {kanbanData.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">{canManageTodos ? <p>No todos yet. Tap + to add the first one.</p> : <p>No todos yet.</p>}</div>
        ) : (
          <div className="w-full min-h-[400px]">
            <KanbanProvider className="w-full" columns={kanbanColumns} data={kanbanData} onDataChange={handleDataChange}>
              {(column) => (
                <KanbanBoard id={column.id} className="h-full bg-transparent border-none shadow-none">
                  <KanbanHeader color={column.id === "todo" ? "blue" : column.id === "in_progress" ? "orange" : "green"} count={groupedTodos[column.id as keyof typeof groupedTodos]?.length || 0}>{column.name}</KanbanHeader>
                  <KanbanCards id={column.id} className="bg-secondary/5 h-full">
                    {(item) => {
                      const todo = todos?.find((t) => t._id === item.id);
                      return (
                        <KanbanCard key={item.id} id={item.id} name={item.name} column={item.column} assignedTo={item.assignedTo} deadline={item.deadline} completionTarget={item.completionTarget} status={item.status} canDelete={item.canDelete} canEdit={todo?.canEdit} contributors={contributors} className="w-full" onEditClick={(todoId) => setEditingTodoId(todoId as Id<"todos">)}>
                          <div className="flex items-start justify-between gap-2 w-full">
                            <span className={`flex-1 min-w-0 text-sm break-words ${column.id === "done" ? "line-through text-muted-foreground" : ""}`}>{item.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {todo?.canDelete && (<Button variant="ghost" size="sm" onClick={() => setTodoToDelete(todo._id as Id<"todos">)} className="text-destructive hover:text-destructive/80 h-6 w-6 p-0 opacity-70 hover:opacity-100 flex-shrink-0"><Trash2 className="w-4 h-4" /></Button>)}
                            </div>
                          </div>
                        </KanbanCard>
                      );
                    }}
                  </KanbanCards>
                </KanbanBoard>
              )}
            </KanbanProvider>
          </div>
        )}

        {!canManageTodos && userId && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center space-x-2"><Lightbulb className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Only the idea author or accepted contributors can add and manage todos.</p></div>
          </div>
        )}

        <Dialog open={isCreateTodoDialogOpen} onOpenChange={setIsCreateTodoDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Add New Todo</DialogTitle><DialogDescription>Create a new task on the Kanban board.</DialogDescription></DialogHeader>
            <form onSubmit={handleCreateTodo}>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5"><Label htmlFor="title" className="text-sm font-medium">Title <span className="text-destructive">*</span></Label><Input id="title" placeholder="Task title..." value={newTodoTitle} onChange={(e) => setNewTodoTitle(e.target.value)} maxLength={200} required /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="assignee" className="text-sm font-medium">Assign To</Label>
                  <Select value={newTodoAssignee} onValueChange={setNewTodoAssignee}>
                    <SelectTrigger id="assignee" className="w-full"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned"><div className="flex items-center"><span className="ml-2">Unassigned</span></div></SelectItem>
                      {contributors.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center gap-2"><Avatar className="h-5 w-5"><AvatarImage src={user.avatar} /><AvatarFallback className="text-[10px]">{user.displayName?.charAt(0) || user.username?.charAt(0)}</AvatarFallback></Avatar><span>{user.displayName || user.username}</span></div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label htmlFor="deadline" className="text-sm font-medium">Deadline</Label><Input id="deadline" type="date" value={newTodoDeadline ? format(newTodoDeadline, "yyyy-MM-dd") : ""} onChange={(e) => setNewTodoDeadline(e.target.value ? new Date(e.target.value) : undefined)} min={new Date().toISOString().slice(0, 10)} /></div>
                <div className="space-y-1.5"><Label htmlFor="target" className="text-sm font-medium">Target <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label><Textarea id="target" placeholder="What needs to be completed..." value={newTodoCompletionTarget} onChange={(e) => setNewTodoCompletionTarget(e.target.value)} rows={3} /></div>
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateTodoDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!newTodoTitle.trim() || isCreating}>{isCreating ? <Spinner size={16} className="mr-2" /> : null}Create Task</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!todoToDelete} onOpenChange={(open) => !open && setTodoToDelete(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Delete Task</DialogTitle><DialogDescription>Are you sure you want to permanently delete this todo? This action cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button type="button" variant="outline" onClick={() => setTodoToDelete(null)} disabled={isDeleting}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={confirmDeleteTodo} disabled={isDeleting}>{isDeleting ? <Spinner size={16} className="mr-2" /> : "Delete"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lifted Edit dialog — modal={false} so it doesn't fight the
         * outer "Project Management" Dialog's focus trap. Rendered once
         * at the TodoSection level instead of once per KanbanCard. */}
        {(() => {
          const editingTodo = todos?.find((t) => t._id === editingTodoId);
          if (!editingTodo) return null;
          return (
            <Dialog
              open={!!editingTodoId}
              onOpenChange={(open) => !open && setEditingTodoId(null)}
              modal={false}
            >
              <TaskEditDialog
                todo={{
                  id: editingTodo._id as string,
                  name: editingTodo.title,
                  column: editingTodo.status,
                  assignedTo: editingTodo.assignedTo
                    ? {
                        _id: editingTodo.assignedTo._id,
                        name: editingTodo.assignedTo.name || editingTodo.assignedTo.username,
                        username: editingTodo.assignedTo.username,
                        avatar: editingTodo.assignedTo.avatar,
                      }
                    : undefined,
                  deadline: editingTodo.deadline,
                  completionTarget: editingTodo.completionTarget,
                  status: editingTodo.status,
                  contributors,
                }}
                contributors={contributors}
                onClose={() => setEditingTodoId(null)}
                onSave={async (updates) => {
                  try {
                    await updateTodoFull({
                      todoId: editingTodo._id as Id<"todos">,
                      title: updates.title,
                      assignedTo: updates.assignedTo as Id<"users"> | undefined,
                      deadline: updates.deadline,
                      completionTarget: updates.completionTarget,
                    });
                  } catch (err) {
                    console.error("Failed to update todo:", err);
                  }
                }}
              />
            </Dialog>
          );
        })()}
      </div>
    </div>
  );
};

const CalendarSection: React.FC<{ idea: ConvexIdea }> = ({ idea }) => {
  const todos = useQuery(api.todos.getTodosForIdea, { ideaId: idea._id as Id<"ideas"> }) || [];
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTodo, setSelectedTodo] = useState<typeof todos[number] | null>(null);
  const updateTodoStatus = useMutation(api.todos.updateTodoStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todosByDay: Record<number, typeof todos> = {};
  todos.forEach((todo) => {
    if (!todo.deadline) return;
    const d = new Date(todo.deadline);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!todosByDay[day]) todosByDay[day] = [];
      todosByDay[day].push(todo);
    }
  });

  const handleStatusChange = async (newStatus: "todo" | "in_progress" | "done") => {
    if (!selectedTodo) return;
    setIsUpdatingStatus(true);
    try {
      await updateTodoStatus({ todoId: selectedTodo._id as Id<"todos">, status: newStatus });
      setSelectedTodo({ ...selectedTodo, status: newStatus });
    } catch (err) { console.error(err); } finally { setIsUpdatingStatus(false); }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="h-8 px-2">← Prev</Button>
        <span className="font-semibold text-sm sm:text-base">{monthName} {year}</span>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="h-8 px-2">Next →</Button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden border border-border">
        {dayNames.map((d, i) => (<div key={`head-${i}`} className="bg-card text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1">{d}</div>))}
        {cells.map((day, i) => (
          <div key={`cell-${i}`} className={cn("bg-card min-h-[40px] sm:min-h-[60px] p-0.5 sm:p-1 flex flex-col text-[10px] sm:text-xs", !day && "opacity-30")}>
            {day && (
              <>
                <span className="font-medium text-foreground/80">{day}</span>
                {todosByDay[day]?.slice(0, 2).map((todo) => (
                  <button key={todo._id} type="button" onClick={() => setSelectedTodo(todo)} className="truncate text-left text-[9px] sm:text-[10px] mt-0.5 px-1 rounded transition-colors cursor-pointer hover:brightness-125 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary" style={{ backgroundColor: todo.status === "done" ? "#86efac33" : todo.status === "in_progress" ? "#93c5fd33" : "#fcd34d33", color: todo.status === "done" ? "#22c55e" : todo.status === "in_progress" ? "#3b82f6" : "#eab308" }} title={todo.title}>{todo.title}</button>
                ))}
                {todosByDay[day] && todosByDay[day].length > 2 && (
                  <button type="button" onClick={() => setSelectedTodo(todosByDay[day][2])} className="text-[8px] text-muted-foreground hover:text-foreground transition-colors text-left mt-0.5">+{todosByDay[day].length - 2} more</button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!selectedTodo} onOpenChange={(open) => !open && setSelectedTodo(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedTodo?.status === "done" ? "#22c55e" : selectedTodo?.status === "in_progress" ? "#3b82f6" : "#eab308" }} />
              {selectedTodo?.title || "Task"}
            </DialogTitle>
            <DialogDescription>{selectedTodo?.status === "done" ? "Completed task" : selectedTodo?.status === "in_progress" ? "In progress" : "Up next"}</DialogDescription>
          </DialogHeader>
          {selectedTodo && (
            <div className="space-y-4 py-2">
              {selectedTodo.deadline && (<div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2"><span className="text-xs text-muted-foreground">Deadline</span><span className="text-sm font-medium">{new Date(selectedTodo.deadline).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</span></div>)}
              {selectedTodo.assignedTo && (<div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2"><span className="text-xs text-muted-foreground">Assignee</span><span className="text-sm font-medium">{selectedTodo.assignedTo.name || selectedTodo.assignedTo.username || "—"}</span></div>)}
              {selectedTodo.completionTarget && (<div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2"><div className="text-xs text-muted-foreground mb-1">Target</div><p className="text-sm whitespace-pre-wrap">{selectedTodo.completionTarget}</p></div>)}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Update status</div>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" size="sm" variant={selectedTodo.status === "todo" ? "default" : "outline"} onClick={() => handleStatusChange("todo")} disabled={isUpdatingStatus || selectedTodo.status === "todo"} className="text-xs">Todo</Button>
                  <Button type="button" size="sm" variant={selectedTodo.status === "in_progress" ? "default" : "outline"} onClick={() => handleStatusChange("in_progress")} disabled={isUpdatingStatus || selectedTodo.status === "in_progress"} className="text-xs">In Progress</Button>
                  <Button type="button" size="sm" variant={selectedTodo.status === "done" ? "default" : "outline"} onClick={() => handleStatusChange("done")} disabled={isUpdatingStatus || selectedTodo.status === "done"} className="text-xs">Done</Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedTodo(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const HierarchicalIdeasSection: React.FC<{
  idea: ConvexIdea;
  ideaTree: TreeNode | null;
  userRequests: Doc<"contributionRequests">[];
  addSubIdeaMutation: (args: { parentId: Id<"ideas">; title: string; description: string; category: string; industries?: string; visibility: string }) => Promise<{ subIdeaId: Id<"ideas">; message: string }>;
}> = ({ idea, ideaTree, userRequests, addSubIdeaMutation }) => {
  const router = useRouter();
  const { userId } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subIdeaTitle, setSubIdeaTitle] = useState("");
  const [subIdeaDescription, setSubIdeaDescription] = useState("");
  const [subIdeaSkills, setSubIdeaSkills] = useState<string[]>([]);
  const [subIdeaIndustries, setSubIdeaIndustries] = useState<string[]>([]);
  const [mandatorySkills, setMandatorySkills] = useState<string[]>([]);
  const [mandatoryIndustries, setMandatoryIndustries] = useState<string[]>([]);
  const [subIdeaVisibility, setSubIdeaVisibility] = useState("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [subIdeaImageFile, setSubIdeaImageFile] = useState<File | null>(null);
  const [subIdeaImagePreview, setSubIdeaImagePreview] = useState<string | null>(null);
  const [subIdeaImageError, setSubIdeaImageError] = useState("");
  const subIdeaFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const generateSubIdeaUploadUrl = useMutation(api.ideas.generateUploadUrl);
  const attachSubIdeaFile = useMutation(api.ideas.attachFileToIdea);

  const isAuthor = idea.isAuthor || false;
  const acceptedRequests = userRequests?.filter((req) => req.status === "accepted" && req.ideaId === idea._id) || [];
  const isAcceptedContributor = acceptedRequests.length > 0;
  const canAddSubIdea = userId && (isAuthor || isAcceptedContributor);

  const handleSubmitSubIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subIdeaTitle.trim() || !subIdeaDescription.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await addSubIdeaMutation({
        parentId: idea._id as Id<"ideas">,
        title: subIdeaTitle.trim(),
        description: subIdeaDescription.trim(),
        category: subIdeaSkills.length > 0 ? JSON.stringify(subIdeaSkills) : "",
        industries: subIdeaIndustries.length > 0 ? JSON.stringify(subIdeaIndustries) : undefined,
        visibility: subIdeaVisibility,
      });

      if (subIdeaImageFile && res.subIdeaId) {
        try {
          const { uploadUrl } = await generateSubIdeaUploadUrl({});
          const uploadResp = await fetch(uploadUrl, { method: "POST", body: subIdeaImageFile });
          if (uploadResp.ok) {
            const { storageId } = await uploadResp.json();
            if (storageId) {
              await attachSubIdeaFile({
                ideaId: res.subIdeaId,
                storageId,
                name: subIdeaImageFile.name,
                type: subIdeaImageFile.type,
                size: subIdeaImageFile.size,
                uploadedAt: Date.now(),
              });
            }
          }
        } catch (uploadErr) {
          console.error("Sub-idea image upload failed:", uploadErr);
        }
      }

      setSubIdeaTitle(""); setSubIdeaDescription(""); setSubIdeaSkills([]); setSubIdeaIndustries([]);
      setMandatorySkills([]); setMandatoryIndustries([]); setSubIdeaVisibility("public");
      setSubIdeaImageFile(null); setSubIdeaImagePreview(null); setSubIdeaImageError("");
      setIsModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create sub-idea");
    } finally { setIsSubmitting(false); }
  };

  const handleSubIdeaImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSubIdeaImageError("");
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) { setSubIdeaImageError("Use JPG, PNG, GIF or WebP."); return; }
    if (file.size > 10 * 1024 * 1024) { setSubIdeaImageError("Image must be under 10MB."); return; }
    setSubIdeaImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setSubIdeaImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearSubIdeaImage = () => {
    setSubIdeaImageFile(null);
    setSubIdeaImagePreview(null);
    setSubIdeaImageError("");
    if (subIdeaFileInputRef.current) subIdeaFileInputRef.current.value = "";
  };

  const renderIdeaTree = (treeNode: TreeNode, level = 0, parentPath: boolean[] = [], isLast = false): React.ReactNode => {
    if (!treeNode) return null;
    const currentPath = level === 0 ? [] : [...parentPath];
    if (level > 0) {
      for (let i = 0; i < level; i++) {
        if (currentPath.length <= i) currentPath.push(false);
      }
      currentPath[level - 1] = isLast;
    }
    // Mark the node that matches the page we're currently on so the user can
    // see where they are in the chain at a glance.
    const isCurrent = treeNode._id === idea._id;
    return (
      <TreeNode key={treeNode._id} nodeId={treeNode._id} level={level} isLast={isLast} parentPath={currentPath}>
        <TreeNodeTrigger
          className={`flex items-center justify-between rounded-md ${isCurrent ? "bg-primary/10 ring-1 ring-primary/40" : ""}`}
          aria-label={`Idea: ${treeNode.title} by ${treeNode.author?.name || treeNode.author?.username}${isCurrent ? " (current)" : ""}`}
          onClick={() => router.push(`/idea/${treeNode._id}`)}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <TreeExpander hasChildren={treeNode.children && treeNode.children.length > 0} />
            <TreeIcon hasChildren={treeNode.children && treeNode.children.length > 0} icon={<Lightbulb className={`w-4 h-4 ${isCurrent ? "text-primary" : ""}`} />} />
            <div className="flex-1 min-w-0">
              <TreeLabel className={`font-medium truncate block ${isCurrent ? "text-primary" : ""}`}>
                {treeNode.title}
                {isCurrent && <span className="ml-2 inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary align-middle">You are here</span>}
              </TreeLabel>
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {parseCategoryDisplay(treeNode.category) || "General"} • by {treeNode.author?.name || treeNode.author?.username}
                {treeNode.childrenCount > 0 && ` • ${treeNode.childrenCount} sub-idea${treeNode.childrenCount !== 1 ? "s" : ""}`}
              </div>
            </div>
            <NodeTodoCount ideaId={treeNode._id as Id<"ideas">} />
          </div>
        </TreeNodeTrigger>

        <TreeNodeContent hasChildren={treeNode.children && treeNode.children.length > 0}>
          <div className="border-l border-border ml-4 pl-4 py-4 space-y-3 min-w-0 overflow-hidden">
            <div className="bg-card/50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed break-words">
                {treeNode.description.length > 200 ? `${treeNode.description.substring(0, 200)}...` : treeNode.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(treeNode.createdAt).toLocaleDateString()}</span>
                {treeNode.children && treeNode.children.length > 0 && (<span>{treeNode.childrenCount} sub-ideas</span>)}
              </div>
            </div>
            <NodeTodoList ideaId={treeNode._id as Id<"ideas">} />
          </div>
          {treeNode.children && treeNode.children.length > 0 &&
            treeNode.children.map((child: TreeNode, index: number) =>
              renderIdeaTree(child, level + 1, currentPath, index === treeNode.children!.length - 1)
            )}
        </TreeNodeContent>
      </TreeNode>
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-card border border-border rounded-xl p-6 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Idea Hierarchy</h3>
          {canAddSubIdea && (
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              setIsModalOpen(open);
              if (open) {
                const parentSkills = idea.category ? idea.category.split(",").map((s) => s.trim()).filter(Boolean) : [];
                const parentIndustries = idea.industries ? idea.industries.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                setMandatorySkills(parentSkills); setMandatoryIndustries(parentIndustries);
                setSubIdeaSkills(parentSkills); setSubIdeaIndustries(parentIndustries);
                setSubIdeaTitle(""); setSubIdeaDescription(""); setSubIdeaVisibility("public"); setError("");
                setSubIdeaImageFile(null); setSubIdeaImagePreview(null); setSubIdeaImageError("");
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Add sub-idea"><Plus className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /></Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-1rem)] max-w-[500px] max-h-[90vh] overflow-hidden p-0 flex flex-col" aria-describedby="sub-idea-description">
                <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-border/40">
                  <DialogTitle>Create Sub-Idea</DialogTitle>
                  <DialogDescription id="sub-idea-description">Add a new idea that expands on this concept.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitSubIdea} className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
                    <div>
                      <label htmlFor="sub-title" className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                      <Input id="sub-title" placeholder="Enter sub-idea title..." value={subIdeaTitle} onChange={(e) => setSubIdeaTitle(e.target.value)} className="mt-1" maxLength={100} autoFocus required />
                    </div>
                    <div>
                      <label htmlFor="sub-description" className="text-sm font-medium">Description <span className="text-destructive">*</span></label>
                      <Textarea id="sub-description" placeholder="Describe your sub-idea..." value={subIdeaDescription} onChange={(e) => setSubIdeaDescription(e.target.value)} className="mt-1 resize-none" rows={4} maxLength={1200} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Skills <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
                      <SkillsMultiSelect selectedSkills={subIdeaSkills} onChange={setSubIdeaSkills} placeholder="Select skills" mandatorySkills={mandatorySkills} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Industries <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
                      <IndustriesMultiSelect selectedIndustries={subIdeaIndustries} onChange={setSubIdeaIndustries} placeholder="Select industries" mandatoryIndustries={mandatoryIndustries} />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Image <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
                      <input
                        ref={subIdeaFileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleSubIdeaImageChange}
                        className="hidden"
                      />
                      {subIdeaImagePreview ? (
                        <div className="relative mt-1 rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={subIdeaImagePreview} alt="Sub-idea preview" className="w-full max-h-56 object-cover" />
                          <button type="button" onClick={clearSubIdeaImage} aria-label="Remove image" className="absolute top-2 right-2 rounded-full bg-black/60 hover:bg-black/80 text-white p-1.5 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => subIdeaFileInputRef.current?.click()} className="absolute bottom-2 right-2 rounded-md bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 transition-colors">
                            Replace
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => subIdeaFileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full h-28 mt-1 rounded-xl border border-dashed border-border/70 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-colors text-center cursor-pointer">
                          <Plus className="w-5 h-5 text-muted-foreground mb-1" />
                          <span className="text-xs font-medium">Add an image</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, GIF, WebP · up to 10 MB</span>
                        </button>
                      )}
                      {subIdeaImageError && (
                        <p className="text-xs text-destructive flex items-center gap-1.5 mt-1.5">
                          <Lightbulb className="w-3 h-3" /> {subIdeaImageError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">Visibility</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="radio" name="sub-visibility" value="public" checked={subIdeaVisibility === "public"} onChange={() => setSubIdeaVisibility("public")} className="w-4 h-4" required />
                          <div><div className="font-medium text-sm">Public</div><div className="text-xs text-muted-foreground">Visible to all users</div></div>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="radio" name="sub-visibility" value="private" checked={subIdeaVisibility === "private"} onChange={() => setSubIdeaVisibility("private")} className="w-4 h-4" />
                          <div><div className="font-medium text-sm">Private</div><div className="text-xs text-muted-foreground">Visible only to your connections</div></div>
                        </label>
                      </div>
                    </div>
                    {error && <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded px-3 py-2">{error}</div>}
                  </div>
                  <DialogFooter className="px-5 py-4 shrink-0 border-t border-border/40 bg-background">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={!subIdeaTitle.trim() || !subIdeaDescription.trim() || isSubmitting}>
                      {isSubmitting ? <Spinner size={16} /> : "Create Sub-Idea"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {ideaTree === undefined ? (
          <div className="flex items-center justify-center py-8"><Spinner size={32} /><p className="ml-3 text-muted-foreground">Loading hierarchy...</p></div>
        ) : ideaTree === null ? (
          <div className="text-center py-8"><p className="text-muted-foreground">No hierarchy data available.</p></div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <TreeProvider showLines={true} showIcons={true} selectable={false} multiSelect={false} animateExpand={true} className="idea-hierarchy-tree h-full">
              <TreeView aria-label="Idea hierarchy tree" className="h-full overflow-auto">{renderIdeaTree(ideaTree)}</TreeView>
            </TreeProvider>
          </div>
        )}

        {!canAddSubIdea && userId && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center space-x-2"><Lightbulb className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Only the idea creator or accepted contributors can add sub-ideas.</p></div>
          </div>
        )}
      </div>
    </div>
  );
};
