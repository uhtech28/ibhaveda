"use client";

import Link from "next/link";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Eye, Trash2, Pencil, Check, Plus, X, Lightbulb } from "lucide-react";
import { useMutation, useQuery } from "convex/react";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";



import { InvitationSection } from "@/components/requests/invitation-section";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { ContributionDashboard } from "@/components/requests/ContributionDashboard";
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
} from "@/components/ui/kibo-ui/kanban";
import { CalendarProvider, CalendarDate, CalendarMonthPicker, CalendarYearPicker, CalendarDatePagination, CalendarHeader, CalendarBody, CalendarItem } from '@/components/ui/kibo-ui/calendar';
import CardUpload from "@/components/card-upload";
import PdfViewer from "@/components/PdfViewer";
import ExcelViewer from "@/components/ExcelViewer";
import WordViewer from "@/components/WordViewer";
import PowerPointViewer from "@/components/PowerPointViewer";
import { IdeaSideNav } from "@/components/IdeaSideNav";
import { IdeaBottomBar } from "@/components/IdeaBottomBar";
import { CreateSubIdeaDialog } from "@/components/ideas/CreateSubIdeaDialog";

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
  author?: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string;
  } | null;
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
  author?: { _id: string; name?: string; username?: string; };
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
  assignedTo?: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  } | null;
  deadline?: number;
  completionTarget?: string;
  author?: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string;
  } | null;
  canEdit?: boolean;
  canDelete?: boolean;
};

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

  // Modal states
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCreateSubIdea, setShowCreateSubIdea] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect if not authenticated
  React.useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
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

  if (!userId) {
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



      <main className="flex-1 w-full py-12 pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">

          {/* Right Sidebar - Desktop (xl+) */}
          <div className="absolute top-0 -right-24 h-full hidden xl:block z-50">
            <div className="sticky top-32">
              <IdeaSideNav
                onOpenHierarchy={() => setShowHierarchy(true)}
                onOpenTodos={() => setShowTodos(true)}
                onOpenCalendar={() => setShowCalendar(true)}
                todoCount={todosQuery?.filter(t => t.status !== 'done').length || 0}
                ideaId={id}
                isContributor={ideaQuery?.isAuthor || userRequestsQuery?.some(r => r.ideaId === id && r.status === "accepted")}
                onCreateSubIdea={() => setShowCreateSubIdea(true)}
              />
            </div>
          </div>

          {/* Right Sidebar - Mobile/Tablet (<xl) */}
          <div className="hidden">
            <IdeaSideNav
              className="fixed right-4 top-1/2 -translate-y-1/2 z-50"
              onOpenHierarchy={() => setShowHierarchy(true)}
              onOpenTodos={() => setShowTodos(true)}
              onOpenCalendar={() => setShowCalendar(true)}
              todoCount={todosQuery?.filter(t => t.status !== 'done').length || 0}
              ideaId={id}
              isContributor={ideaQuery?.isAuthor || userRequestsQuery?.some(r => r.ideaId === id && r.status === "accepted")}
              onCreateSubIdea={() => setShowCreateSubIdea(true)}
            />
          </div>

          {ideaQuery === undefined ? (
            // Loading state
            <div className="flex items-center justify-center py-12">
              <Spinner size={48} />
              <p className="ml-4 text-muted-foreground">Loading idea...</p>
            </div>
          ) : ideaQuery === null ? (
            // Not found state
            <div className="text-center py-12">
              <Eye className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Idea Not Found</h2>
              <p className="text-muted-foreground mb-6">The idea you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => router.push('/feed')}>
                Back to Feed
              </Button>
            </div>
          ) : (
            <>
              <div className="pb-8">
                <IdeaContent
                  idea={ideaQuery as ConvexIdea}
                  onTagClick={setSearchQuery}
                  onOpenComments={() => setShowComments(true)}
                  onOpenRequests={() => setShowRequests(true)}
                  requestCount={userRequestsQuery?.filter(r => r.ideaId === ideaQuery._id && r.status === 'pending').length || 0}
                />
              </div>

              {/* Modals for Sections */}
              <Dialog open={showHierarchy} onOpenChange={setShowHierarchy}>
                <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto w-full">
                  <DialogHeader>
                    <DialogTitle>Idea Hierarchy</DialogTitle>
                  </DialogHeader>
                  <HierarchicalIdeasSection
                    idea={ideaQuery as ConvexIdea}
                    ideaTree={ideaTreeQuery}
                    userRequests={userRequestsQuery || []}
                    addSubIdeaMutation={addSubIdeaMutation}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={showRequests} onOpenChange={setShowRequests}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto w-full">
                  <DialogHeader>
                    <DialogTitle>Contribution Requests</DialogTitle>
                  </DialogHeader>
                  <ContributionDashboard
                    ideaId={ideaQuery._id as Id<"ideas">}
                    ideaTitle={(ideaQuery as ConvexIdea).title}
                    authorId={(ideaQuery as ConvexIdea).authorId}
                    authorName={(ideaQuery as ConvexIdea).author?.name || (ideaQuery as ConvexIdea).author?.username}
                    isAuthor={(ideaQuery as ConvexIdea).isAuthor || false}
                    onClose={() => setShowRequests(false)}
                  />
                  <InvitationSection idea={{ _id: ideaQuery._id as Id<"ideas">, isAuthor: (ideaQuery as ConvexIdea).isAuthor || false }} />
                </DialogContent>
              </Dialog>

              <Dialog open={showTodos} onOpenChange={setShowTodos}>
                <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl">
                  <DialogHeader className="p-6 pb-2 shrink-0 border-b">
                    <DialogTitle className="text-xl">Project Management</DialogTitle>
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
                <DialogContent className="w-[95vw] max-w-5xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
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

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  const [showAllIndustries, setShowAllIndustries] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  // Robust parsing of categories (skills) and industries that might be JSON arrays or CSV strings
  const parseTags = (tagStr?: string): string[] => {
    if (!tagStr) return [];
    try {
      // Try parsing as JSON first (if stored as an array string)
      const parsed = JSON.parse(tagStr);
      if (Array.isArray(parsed)) {
        return parsed.map(s => String(s).trim()).filter(s => s);
      }
    } catch {
      // If not JSON, split by comma
    }
    return tagStr.split(',').map(s => s.trim()).filter(s => s);
  };

  const skills = parseTags(idea.category);
  const industries = parseTags(idea.industries);

  const displayedIndustries = showAllIndustries ? industries : industries.slice(0, 1);
  const displayedSkills = showAllSkills ? skills : skills.slice(0, 1);

  const firstImageAttachment = Array.isArray(idea.attachments)
    ? idea.attachments.find(att => (att.type || "").toLowerCase().startsWith("image/"))
    : undefined;

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
        visibility: editedVisibility
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
      // Redirect after successful deletion
      router.push('/feed');
    } catch (err) {
      setErrorMsg("Failed to delete idea. Please try again.");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrorMsg("");
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card text-card-foreground transition-all duration-300 flex flex-col shadow-xl">
      {/* Header Section */}
      <div className="relative h-64 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 overflow-hidden shrink-0">
        {firstImageAttachment ? (
          <Image
            src={firstImageAttachment.url}
            alt={idea.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center">
            <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-6xl font-bold text-foreground/80 shadow-2xl ring-1 ring-white/30">
              {idea.title.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Title (Top Left) */}
        <div className="absolute top-6 left-6 max-w-[80%] z-10">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-2xl font-bold bg-background/80 backdrop-blur-md border-white/20 h-auto py-2"
              placeholder="Idea Title"
            />
          ) : (
            <h1 className="text-2xl font-bold leading-tight text-foreground/90 bg-background/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-sm text-left line-clamp-3 break-words">
              {idea.title}
            </h1>
          )}
        </div>

        {/* Author (Top Right) */}
        <Link
          href={`/profile/${idea.author?.username || idea.authorId}`}
          className="absolute top-4 right-4 flex items-center gap-3 bg-background/30 backdrop-blur-md p-1.5 sm:px-3 sm:py-2 rounded-full border border-white/10 shadow-sm z-10 transition-all hover:bg-background/40 hover:scale-105 cursor-pointer"
        >
          {idea.author?.avatar ? (
            <Image
              src={idea.author.avatar}
              alt={idea.author?.name || idea.author?.username || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
              width={32}
              height={32}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary border border-white/20 shrink-0">
              {getInitials(idea.author?.name || idea.author?.username || 'U')}
            </div>
          )}
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[11px] font-semibold text-foreground/90 leading-none truncate max-w-[80px] sm:max-w-[150px]">
              {idea.author?.name || idea.author?.username || 'Unknown'}
            </span>
            <span className="text-[9px] text-muted-foreground pt-0.5">
              {formatDistanceToNow(idea.createdAt, { addSuffix: true })}
            </span>
          </div>
        </Link>

        {/* Edit Actions (Bottom Right of Header) */}
        {(idea.isAuthor || false) && !isEditing && (
          <div className="absolute bottom-2 right-2 flex gap-1.5 z-10">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleEdit}
              className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/80 border border-white/10 shadow-sm"
            >
              <Pencil className="w-4 h-4 text-foreground/80" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 rounded-full bg-red-500/80 backdrop-blur-md hover:bg-red-600/90 border border-white/10 shadow-sm"
            >
              {isDeleting ? <Spinner size={14} /> : <Trash2 className="w-4 h-4 text-white" />}
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-8 flex flex-col gap-8">
        {/* Description */}
        <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
          {isEditing ? (
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="min-h-[200px] resize-y"
              placeholder="Describe your idea..."
            />
          ) : (
            <p className="whitespace-pre-wrap">{idea.description}</p>
          )}
        </div>



        {/* Tags */}
        <div className="flex flex-col gap-4 pt-6 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-2">
            {/* Industries */}
            {displayedIndustries.map((tag, i) => (
              <button
                key={`ind-${i}`}
                onClick={() => onTagClick?.(tag)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
            {!showAllIndustries && industries.length > 1 && (
              <button
                onClick={() => setShowAllIndustries(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-500/5 text-purple-600 border border-purple-500/10 hover:bg-purple-500/10 transition-colors"
                title={`Show ${industries.length - 1} more industries`}
              >
                •••
              </button>
            )}

            {/* Skills */}
            {displayedSkills.map((tag, i) => (
              <button
                key={`skill-${i}`}
                onClick={() => onTagClick?.(tag)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
            {!showAllSkills && skills.length > 1 && (
              <button
                onClick={() => setShowAllSkills(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-500/5 text-blue-600 border border-blue-500/10 hover:bg-blue-500/10 transition-colors"
                title={`Show ${skills.length - 1} more skills`}
              >
                •••
              </button>
            )}

            {/* Collapse Button */}
            {(showAllIndustries && industries.length > 1) || (showAllSkills && skills.length > 1) ? (
              <button
                onClick={() => {
                  setShowAllIndustries(false);
                  setShowAllSkills(false);
                }}
                className="text-xs font-medium px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors ml-1"
                title="Show less"
              >
                Show less
              </button>
            ) : null}
          </div>
        </div>

        {/* Attachments Preview */}
        {Array.isArray(idea.attachments) && idea.attachments.length > 0 && (
          <div className="flex flex-col gap-4 pt-6 border-t border-border/50">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
              {idea.attachments.map((att, idx) => {
                const mime = (att.type || "").toLowerCase();
                const key = att.fileId || `${att.name}-${idx}`;
                if (mime.startsWith("image/")) {
                  return (
                    <div key={key} className="rounded-xl border bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                        <span>{att.name}</span>
                        <a href={att.url} target="_blank" rel="noreferrer" className="underline">Open</a>
                      </div>
                      <div className="w-full h-[70vh] rounded-md border overflow-hidden relative">
                        <Image src={att.url} alt={att.name} fill className="object-contain" />
                      </div>
                    </div>
                  );
                }
                if (mime.startsWith("video/") || mime.includes("mp4")) {
                  return (
                    <div key={key} className="rounded-xl border bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                        <span>{att.name}</span>
                        <a href={att.url} target="_blank" rel="noreferrer" className="underline">Open</a>
                      </div>
                      <div className="w-full h-[70vh] rounded-md border overflow-hidden">
                        <video
                          src={att.url}
                          className="w-full h-full"
                          controls
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        />
                      </div>
                    </div>
                  );
                }
                if (mime.includes("pdf")) {
                  return (
                    <div key={key} className="rounded-xl border bg-muted/30 p-4">
                      <PdfViewer url={att.url} fileName={att.name} />
                    </div>
                  );
                }
                if (mime.includes("word") || mime.includes("msword") || mime.includes("officedocument.wordprocessingml.document")) {
                  return (
                    <div key={key} className="rounded-xl border bg-muted/30 p-4">
                      <WordViewer url={att.url} fileName={att.name} />
                    </div>
                  );
                }
                if (mime.includes("excel") || mime.includes("spreadsheetml") || mime.includes("ms-excel") || mime.includes("officedocument.spreadsheetml.sheet")) {
                  return (
                    <div key={key} className="rounded-xl border bg-muted/30 p-4">
                      <ExcelViewer url={att.url} fileName={att.name} />
                    </div>
                  );
                }
                if (mime.includes("powerpoint") || mime.includes("presentationml") || mime.includes("ms-powerpoint") || mime.includes("officedocument.presentationml.presentation")) {
                  return (
                    <div key={key} className="rounded-xl border bg-muted/30 p-4">
                      <PowerPointViewer url={att.url} fileName={att.name} />
                    </div>
                  );
                }
                return (
                  <div key={key} className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                      <span>{att.name}</span>
                      <a href={att.url} target="_blank" rel="noreferrer" className="underline">Open</a>
                    </div>
                    <div className="text-sm text-muted-foreground">Preview not available for this file type.</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Edit Mode Actions */}
        {isEditing && (
          <div className="flex items-center gap-4 pt-4 border-t border-border/50">
            <Button onClick={handleSave} disabled={updating}>
              {updating ? <div className="mr-2"><Spinner size={16} /></div> : <Check className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={updating}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}
          </div>
        )}
        {/* Action Bar (Attached Footer) */}
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
  createTodoMutation: (args: { ideaId: Id<"ideas">; title: string }) => Promise<{ todoId: string; message: string }>;
  updateTodoMutation: (args: { todoId: Id<"todos">; title: string }) => Promise<{ message: string }>;
  updateTodoStatusMutation: (args: { todoId: Id<"todos">; status: "todo" | "in_progress" | "done" }) => Promise<{ status: "todo" | "in_progress" | "done"; message: string }>;
  deleteTodoMutation: (args: { todoId: Id<"todos"> }) => Promise<{ message: string }>;
}> = ({ idea, todos, createTodoMutation, updateTodoMutation, updateTodoStatusMutation, deleteTodoMutation }) => {
  const { userId } = useAuth();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<Id<"todos"> | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Check permissions
  const isAuthor = idea.isAuthor || false;
  const hasAcceptedContribution = useQuery(api.contributionRequests.getMyRequests)
    ?.find(req => req.ideaId === idea._id && req.status === "accepted");
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
      });
      setNewTodoTitle("");
    } catch (err) {
      setError("Failed to create todo");
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  // Get all contributors (author + accepted contributors)
  const allUsers = useQuery(api.users.getAllUsers) || [];
  const acceptedRequests = useQuery(api.contributionRequests.getAcceptedContributors, { ideaId: idea._id as Id<"ideas"> }) || [];

  const contributors = allUsers.filter(u => {
    // Include author
    if (u._id === idea.authorId) return true;
    // Include accepted contributors
    return acceptedRequests.some(req => req.contributorId === u._id && req.status === "accepted");
  }).map(u => ({
    _id: u._id,
    clerkId: u.clerkId,
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatar
  }));


  const handleDeleteTodo = async (todoId: Id<"todos">) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;
    try {
      await deleteTodoMutation({ todoId });
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  };

  const handleEditTodo = (todoId: Id<"todos">, currentTitle: string) => {
    setEditingTodoId(todoId);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = async () => {
    if (!editingTodoId || !editingTitle.trim()) return;

    setIsUpdating(true);
    try {
      await updateTodoMutation({
        todoId: editingTodoId,
        title: editingTitle.trim(),
      });
      setEditingTodoId(null);
      setEditingTitle("");
    } catch (err) {
      console.error("Failed to update todo:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setEditingTitle("");
  };


  const groupedTodos = todos?.reduce(
    (acc, todo) => {
      if (todo.status === "todo") {
        acc.todo.push(todo);
      } else if (todo.status === "in_progress") {
        acc.in_progress.push(todo);
      } else {
        acc.done.push(todo);
      }
      return acc;
    },
    { todo: [] as Todo[], in_progress: [] as Todo[], done: [] as Todo[] }
  ) || { todo: [], in_progress: [], done: [] };

  // Transform data for kanban component
  const kanbanColumns = [
    { id: "todo", name: "Todo" },
    { id: "in_progress", name: "In Progress" },
    { id: "done", name: "Done" },
  ];

  const kanbanData = todos?.map((todo) => ({
    id: todo._id as string,
    name: todo.title,
    column: todo.status,
    assignedTo: todo.assignedTo || undefined,
    deadline: todo.deadline,
    completionTarget: todo.completionTarget,
    canDelete: todo.canDelete || false,
  })) || [];

  const handleDataChange = async (newData: typeof kanbanData) => {
    // Find the changed todo by comparing with current todos
    const currentTodos = todos || [];
    const newTodos = newData.map(item => ({
      id: item.id,
      status: item.column as "todo" | "in_progress" | "done",
      canDelete: item.canDelete,
    }));

    // Find differences
    for (const newTodo of newTodos) {
      const existingTodo = currentTodos.find(t => t._id === newTodo.id);
      if (existingTodo && existingTodo.status !== newTodo.status) {
        try {
          await updateTodoStatusMutation({
            todoId: newTodo.id as Id<"todos">,
            status: newTodo.status
          });
        } catch (err) {
          console.error("Failed to update todo status:", err);
        }
        break; // Only update one at a time to avoid conflicts
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h3 className="text-lg font-semibold">Kanban Board</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-border/50">
            <Check className="w-4 h-4" />
            <span>{groupedTodos.done.length} done</span>
            <span className="mx-1 opacity-30">•</span>
            <span>{groupedTodos.in_progress.length} in progress</span>
            <span className="mx-1 opacity-30">•</span>
            <span>{groupedTodos.todo.length} todo</span>
          </div>
        </div>

        {/* Create new todo form */}
        {canManageTodos && (
          <form onSubmit={handleCreateTodo} className="mb-6">
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input
                id="new-todo-input"
                placeholder="Add a new todo..."
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                className="flex-1"
                maxLength={200}
                disabled={isCreating}
              />
              <Button
                type="submit"
                disabled={!newTodoTitle.trim() || isCreating}
                className="self-start sm:self-auto"
              >
                {isCreating ? <Spinner size={16} /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          </form>
        )}

        {/* Kanban Board */}
        {kanbanData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {canManageTodos ? (
              <p>No todos yet. Add your first todo above!</p>
            ) : (
              <p>No todos yet.</p>
            )}
          </div>
        ) : (
          <div className="w-full min-h-[500px]">
            <KanbanProvider
              className="w-full"
              columns={kanbanColumns}
              data={kanbanData}
              onDataChange={handleDataChange}
            >
              {(column) => (
                <KanbanBoard id={column.id} className="h-full bg-transparent border-none shadow-none">
                  <KanbanHeader
                    color={column.id === 'todo' ? 'blue' : column.id === 'in_progress' ? 'orange' : 'green'}
                    count={groupedTodos[column.id as keyof typeof groupedTodos]?.length || 0}
                  >
                    {column.name}
                  </KanbanHeader>
                  <KanbanCards
                    id={column.id}
                    className="bg-secondary/5 h-full"
                    onAdd={() => document.getElementById('new-todo-input')?.focus()}
                  >
                    {(item) => {
                      // Find the full todo data
                      const todo = todos?.find(t => t._id === item.id);

                      return (
                        <KanbanCard
                          key={item.id}
                          id={item.id}
                          name={item.name}
                          column={item.column}
                          assignedTo={item.assignedTo}
                          deadline={item.deadline}
                          completionTarget={item.completionTarget}
                          status={item.status}
                          canDelete={item.canDelete}
                          canEdit={todo?.canEdit}
                          contributors={contributors}
                          className="w-full"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`flex-1 text-sm ${column.id === "done" ? "line-through text-muted-foreground" : ""
                              }`}>
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1">
                              {todo?.canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTodo(todo._id as Id<"todos">)}
                                  className="text-destructive hover:text-destructive/80 h-6 w-6 p-0 opacity-70 hover:opacity-100 flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
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

        {/* Permission notice */}
        {!canManageTodos && userId && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Only the idea author or accepted contributors can add and manage todos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CalendarSection: React.FC<{ idea: ConvexIdea }> = ({ idea }) => {
  return (
    <div className="w-full h-full flex flex-col sm:p-2 -mx-4 sm:mx-0">
      <div className="bg-card border-y sm:border border-border sm:rounded-xl p-4 sm:p-6 transition-colors overflow-x-auto">
        <div className="min-w-[600px]">
          <CalendarProvider ideaId={idea._id as string}>
            <CalendarDate>
              <CalendarMonthPicker />
              <CalendarYearPicker start={2023} end={2026} />
              <CalendarDatePagination />
            </CalendarDate>
            <CalendarHeader />
            <CalendarBody>
              {({ feature, task, onEdit }) => <CalendarItem key={feature.id} feature={feature} task={task} onEdit={onEdit} />}
            </CalendarBody>
          </CalendarProvider>
        </div>
      </div>
    </div>
  );
};

const HierarchicalIdeasSection: React.FC<{
  idea: ConvexIdea;
  ideaTree: TreeNode | null;
  userRequests: Doc<"contributionRequests">[];
  addSubIdeaMutation: (args: {
    parentId: Id<"ideas">;
    title: string;
    description: string;
    category: string;
    industries?: string;
    visibility: string;
  }) => Promise<{
    subIdeaId: Id<"ideas">;
    message: string;
  }>;
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


  // Check if user is accepted contributor or author
  const isAuthor = idea.isAuthor || false;
  const acceptedRequests = userRequests?.filter(req =>
    req.status === "accepted" && req.ideaId === idea._id
  ) || [];
  const isAcceptedContributor = acceptedRequests.length > 0;
  const canAddSubIdea = userId && (isAuthor || isAcceptedContributor);

  const handleSubmitSubIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subIdeaTitle.trim() || !subIdeaDescription.trim() || subIdeaSkills.length === 0 || subIdeaIndustries.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      await addSubIdeaMutation({
        parentId: idea._id as Id<"ideas">,
        title: subIdeaTitle.trim(),
        description: subIdeaDescription.trim(),
        category: subIdeaSkills.join(', '),
        industries: subIdeaIndustries.length > 0 ? subIdeaIndustries.join(', ') : undefined,
        visibility: subIdeaVisibility,
      });

      // Reset form and close modal
      setSubIdeaTitle("");
      setSubIdeaDescription("");
      setSubIdeaSkills([]);
      setSubIdeaIndustries([]);
      setMandatorySkills([]);
      setMandatoryIndustries([]);
      setSubIdeaVisibility("public");
      setIsModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create sub-idea");
    } finally {
      setIsSubmitting(false);
    }
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

    return (
      <TreeNode
        key={treeNode._id}
        nodeId={treeNode._id}
        level={level}
        isLast={isLast}
        parentPath={currentPath}
      >
        <TreeNodeTrigger
          className="flex items-center justify-between"
          aria-label={`Idea: ${treeNode.title} by ${treeNode.author?.name || treeNode.author?.username}`}
          onClick={() => router.push(`/idea/${treeNode._id}`)}
        >
          <div className="flex items-center space-x-3">
            <TreeExpander hasChildren={treeNode.children && treeNode.children.length > 0} />
            <TreeIcon hasChildren={treeNode.children && treeNode.children.length > 0} icon={<Lightbulb className="w-4 h-4" />} />
            <div className="flex-1">
              <TreeLabel className="font-medium">{treeNode.title}</TreeLabel>
              <div className="text-xs text-muted-foreground mt-1">
                {treeNode.category || 'General'} • by {treeNode.author?.name || treeNode.author?.username}
                {treeNode.childrenCount > 0 && ` • ${treeNode.childrenCount} sub-idea${treeNode.childrenCount !== 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
        </TreeNodeTrigger>

        <TreeNodeContent hasChildren={treeNode.children && treeNode.children.length > 0}>
          <div className="border-l border-border ml-4 pl-4 py-4">
            <div className="bg-card/50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {treeNode.description.length > 200
                  ? `${treeNode.description.substring(0, 200)}...`
                  : treeNode.description
                }
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(treeNode.createdAt).toLocaleDateString()}</span>
                {treeNode.children && treeNode.children.length > 0 && (
                  <span>{treeNode.childrenCount} sub-ideas</span>
                )}
              </div>
            </div>
          </div>
          {treeNode.children && treeNode.children.length > 0 &&
            treeNode.children.map((child: TreeNode, index: number) =>
              renderIdeaTree(
                child,
                level + 1,
                currentPath,
                index === treeNode.children!.length - 1
              )
            )
          }
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
                // Pre-populate with parent idea's skills and industries
                const parentSkills = idea.category ? idea.category.split(',').map(s => s.trim()).filter(s => s) : [];
                const parentIndustries = idea.industries ? idea.industries.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [];

                // Debug logging
                console.log('Parent idea industries:', idea.industries);
                console.log('Parsed parent industries:', parentIndustries);

                setMandatorySkills(parentSkills);
                setMandatoryIndustries(parentIndustries);
                setSubIdeaSkills(parentSkills);
                setSubIdeaIndustries(parentIndustries);
                // Clear other fields
                setSubIdeaTitle("");
                setSubIdeaDescription("");
                setSubIdeaVisibility("public");
                setError("");
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Add sub-idea">
                  <Plus className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" aria-describedby="sub-idea-description">
                <DialogHeader>
                  <DialogTitle>Create Sub-Idea</DialogTitle>
                  <DialogDescription id="sub-idea-description">
                    Add a new idea that expands on this concept. Your sub-idea will be publicly visible under the parent idea.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmitSubIdea} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="sub-title" className="text-sm font-medium">
                        Title *
                      </label>
                      <Input
                        id="sub-title"
                        placeholder="Enter sub-idea title..."
                        value={subIdeaTitle}
                        onChange={(e) => setSubIdeaTitle(e.target.value)}
                        className="mt-1"
                        maxLength={100}
                        autoFocus
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="sub-description" className="text-sm font-medium">
                        Description *
                      </label>
                      <Textarea
                        id="sub-description"
                        placeholder="Describe your sub-idea..."
                        value={subIdeaDescription}
                        onChange={(e) => setSubIdeaDescription(e.target.value)}
                        className="mt-1 resize-none"
                        rows={4}
                        maxLength={1200}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Skills <span className="text-destructive">*</span>
                      </label>
                      <SkillsMultiSelect
                        selectedSkills={subIdeaSkills}
                        onChange={setSubIdeaSkills}
                        placeholder="Select skills for your sub-idea"
                        mandatorySkills={mandatorySkills}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Industries <span className="text-destructive">*</span>
                      </label>
                      <IndustriesMultiSelect
                        selectedIndustries={subIdeaIndustries}
                        onChange={setSubIdeaIndustries}
                        placeholder="Select industries for your sub-idea"
                        mandatoryIndustries={mandatoryIndustries}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">Visibility</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="sub-visibility"
                            value="public"
                            checked={subIdeaVisibility === 'public'}
                            onChange={() => setSubIdeaVisibility('public')}
                            className="w-4 h-4 text-primary border-border focus:ring-ring focus:ring-2"
                            required
                          />
                          <div>
                            <div className="font-medium text-sm">Public</div>
                            <div className="text-xs text-muted-foreground">Visible to all users</div>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="sub-visibility"
                            value="private"
                            checked={subIdeaVisibility === 'private'}
                            onChange={() => setSubIdeaVisibility('private')}
                            className="w-4 h-4 text-primary border-border focus:ring-ring focus:ring-2"
                          />
                          <div>
                            <div className="font-medium text-sm">Private</div>
                            <div className="text-xs text-muted-foreground">Visible only to your connections</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                      {error}
                    </div>
                  )}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => setIsModalOpen(false)}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={!subIdeaTitle.trim() || !subIdeaDescription.trim() || subIdeaSkills.length === 0 || subIdeaIndustries.length === 0 || isSubmitting}
                    >
                      {isSubmitting ? <Spinner size={16} /> : "Create Sub-Idea"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {ideaTree === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size={32} />
            <p className="ml-3 text-muted-foreground">Loading hierarchy...</p>
          </div>
        ) : ideaTree === null ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hierarchy data available.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <TreeProvider
              showLines={true}
              showIcons={true}
              selectable={false}
              multiSelect={false}
              animateExpand={true}
              className="idea-hierarchy-tree h-full"
            >
              <TreeView aria-label="Idea hierarchy tree" className="h-full overflow-auto">
                {renderIdeaTree(ideaTree)}
              </TreeView>
            </TreeProvider>
          </div>
        )}

        {!canAddSubIdea && userId && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Only the idea creator or accepted contributors can add sub-ideas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
