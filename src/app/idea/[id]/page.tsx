"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Eye, Trash2, Pencil, MessageCircle, Check, Plus, Lightbulb, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";

import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";

import { notifyRequestSent } from "@/components/requests/notification-toast";
import { InvitationSection } from "@/components/requests/invitation-section";
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
import { IdeaSideNav } from "@/components/IdeaSideNav";
import { IdeaBottomBar } from "@/components/IdeaBottomBar";

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
};

type Comment = {
  _id: string;
  authorId: string;
  content: string;
  createdAt: number;
  parentCommentId?: string;
  author: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string;
  } | null;
};

type ContributionRequest = {
  _id: Id<"contributionRequests">;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  contributor: { name: string; username: string; } | null;
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
      <HeroHeader />

      {/* Back Button */}
      <div className="border-b border-border pt-16 pb-4 rounded-b-xl">
        <div className="container mx-auto px-4 rounded-xl">
          <Button
          variant="ghost"
          onClick={() => router.push('/feed')}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
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
            <div className="pb-24"> {/* Add padding bottom for fixed bottom bar */}
              <IdeaContent idea={ideaQuery as ConvexIdea} />
            </div>

            <IdeaSideNav
              onOpenHierarchy={() => setShowHierarchy(true)}
              onOpenTodos={() => setShowTodos(true)}
              onOpenCalendar={() => setShowCalendar(true)}
              todoCount={todosQuery?.filter(t => t.status !== 'done').length || 0}
            />

            <IdeaBottomBar
              ideaId={ideaQuery._id}
              initialSparkCount={(ideaQuery as ConvexIdea).sparkCount}
              initialHasSparked={(ideaQuery as ConvexIdea).hasSparked || false}
              commentCount={(ideaQuery as ConvexIdea).commentCount}
              onOpenComments={() => setShowComments(true)}
              onOpenRequests={() => setShowRequests(true)}
              isAuthor={(ideaQuery as ConvexIdea).isAuthor || false}
              requestCount={userRequestsQuery?.filter(r => r.ideaId === ideaQuery._id && r.status === 'pending').length || 0}
            />

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
                <ContributionRequestSection idea={ideaQuery as ConvexIdea} />
                <InvitationSection idea={{ _id: ideaQuery._id as Id<"ideas">, isAuthor: (ideaQuery as ConvexIdea).isAuthor || false }} />
              </DialogContent>
            </Dialog>

            <Dialog open={showTodos} onOpenChange={setShowTodos}>
              <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto w-full">
                <DialogHeader>
                  <DialogTitle>Project Management</DialogTitle>
                </DialogHeader>
                <TodoSection
                  idea={ideaQuery as ConvexIdea}
                  todos={todosQuery || []}
                  createTodoMutation={createTodoMutation}
                  updateTodoMutation={updateTodoMutation}
                  updateTodoStatusMutation={updateTodoStatusMutation}
                  deleteTodoMutation={deleteTodoMutation}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
              <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto w-full">
                <DialogHeader>
                  <DialogTitle>Calendar</DialogTitle>
                </DialogHeader>
                <CalendarSection idea={ideaQuery as ConvexIdea} />
              </DialogContent>
            </Dialog>

            <Dialog open={showComments} onOpenChange={setShowComments}>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto w-full">
                <DialogHeader>
                  <DialogTitle>Comments</DialogTitle>
                </DialogHeader>
                <CommentsSection ideaId={ideaQuery._id as Id<"ideas">} commentCount={(ideaQuery as ConvexIdea).commentCount} />
              </DialogContent>
            </Dialog>
          </>

        )}
      </main>

      <FooterSection />
    </div>
  );
}

const ContributionRequestSection: React.FC<{ idea: ConvexIdea }> = ({ idea }) => {
  const { userId } = useAuth();
  const createRequestMutation = useMutation(api.contributionRequests.createContributionRequest);
  const incomingRequests = useQuery(api.contributionRequests.getRequestsByIdea, { ideaId: idea._id as Id<"ideas"> });

  // Use the backend-calculated isAuthor field instead of comparing IDs directly
  const isAuthor = idea.isAuthor || false;

  // For authors: Show incoming requests
  if (isAuthor) {
    console.log("[FIXED] Author view rendered - isAuthor:", isAuthor);
    console.log("[FIXED] Author view - request count:", incomingRequests?.length || 0);
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-card border border-border rounded-xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Incoming Contribution Requests</h3>
            <Link href={`/profile/contribution-requests/${idea._id}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                View All
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </Link>
          </div>
          {incomingRequests === undefined ? (
            <div className="text-center py-4">
              <Spinner size={24} />
              <p className="text-muted-foreground mt-2">Loading requests...</p>
            </div>
          ) : incomingRequests && incomingRequests.length > 0 ? (
            <>
              {console.log("[SUCCESS] Found incoming requests:", incomingRequests.length)}
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <IncomingRequestCard key={request._id} request={request} />
                ))}
              </div>
            </>
          ) : (
            <>
              {console.log('[SUCCESS] No contribution requests found - section should display "No contribution requests received yet."')}
              <p className="text-muted-foreground py-4">
                No contribution requests received yet.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }


  // For contributors: Show request interface only if logged in
  if (!userId) return null;

  return <ContributorRequestSection idea={idea} createRequestMutation={createRequestMutation} />;
};

// New component for incoming requests (author view)
const IncomingRequestCard: React.FC<{ request: ContributionRequest }> = ({ request }) => {
  const updateStatusMutation = useMutation(api.contributionRequests.updateRequestStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusUpdate = async (status: "accepted" | "rejected") => {
    try {
      setIsUpdating(true);
      await updateStatusMutation({ requestId: request._id, status });
    } catch (error) {
      console.error("Failed to update request status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback>
              {request.contributor?.name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{request.contributor?.name || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">@{request.contributor?.username || "unknown"}</p>
          </div>
        </div>
        <Badge variant={request.status === "accepted" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </div>
      <p className="text-sm mt-2">{request.message}</p>
      {request.status === "pending" && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => handleStatusUpdate("accepted")}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? <Spinner size={14} /> : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusUpdate("rejected")}
            disabled={isUpdating}
          >
            {isUpdating ? <Spinner size={14} /> : "Reject"}
          </Button>
        </div>
      )}
    </div>
  );
};

// New component for contributor request sending
const ContributorRequestSection: React.FC<{
  idea: ConvexIdea;
  createRequestMutation: (args: { ideaId: Id<"ideas">; message: string }) => Promise<{ requestId: string; message: string }>;
}> = ({ idea, createRequestMutation }) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [existingRequest, setExistingRequest] = React.useState<Doc<"contributionRequests"> | null>(null);

  // Check if user already has a request
  const userRequests = useQuery(api.contributionRequests.getMyRequests);
  React.useEffect(() => {
    if (userRequests) {
      const request = userRequests.find(req => req.ideaId === idea._id);
      setExistingRequest(request || null);
    }
  }, [userRequests, idea._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      await createRequestMutation({
        ideaId: idea._id as Id<"ideas">,
        message: message.trim(),
      });

      // Close modal and clear message
      setIsDialogOpen(false);
      setMessage("");
      // Note: Query will automatically update
      notifyRequestSent();
    } catch (err: unknown) {
      console.error("Failed to send contribution request:", err);
      setError(err instanceof Error ? err.message : "Failed to send contribution request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    if (!existingRequest) return null;

    const status = existingRequest.status;
    const badgeColor = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      accepted: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    }[status as "pending" | "accepted" | "rejected"] || "bg-gray-100 text-gray-800 border-gray-300";

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={`border ${badgeColor}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <div className="border border-border rounded-lg p-4 bg-muted/50">
          <p className="text-sm font-medium mb-2">Your message:</p>
          <p className="text-sm text-muted-foreground">{existingRequest.message}</p>
        </div>
        {status === "rejected" && (
          <p className="text-sm text-muted-foreground mt-2">
            You can submit a new request if you'd like to try again.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 transition-colors max-h-[80vh] overflow-hidden flex flex-col">
        <h3 className="text-lg font-semibold mb-4">
          {existingRequest ? "Your Contribution Request" : "Interested in contributing?"}
        </h3>

        {existingRequest ? (
          <div>
            {getStatusDisplay()}
            {existingRequest.status === "rejected" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Submit New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Request to Contribute</DialogTitle>
                    <DialogDescription>
                      Let {idea.author?.name || 'the author'} know how you'd like to help with this idea.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="message" className="text-sm font-medium">
                          Describe your contribution
                        </label>
                        <Textarea
                          id="message"
                          placeholder="Tell us how you can contribute to this idea..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="resize-none"
                          rows={4}
                          maxLength={1200}
                          autoFocus
                          required
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{error}</span>
                          <span>{message.length}/1200</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        disabled={!message.trim() || isSubmitting || message.length > 1200}
                      >
                        {isSubmitting ? <Spinner size={16} /> : "Send Request"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <MessageCircle className="w-4 h-4 mr-2" />
                Request to Contribute
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Request to Contribute</DialogTitle>
                <DialogDescription>
                  Let {idea.author?.name || 'the author'} know how you'd like to help with this idea.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Describe your contribution
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how you can contribute to this idea..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="resize-none"
                      rows={4}
                      maxLength={1200}
                      autoFocus
                      required
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{error}</span>
                      <span>{message.length}/1200</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={!message.trim() || isSubmitting || message.length > 1200}
                  >
                    {isSubmitting ? <Spinner size={16} /> : "Send Request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

const CommentsSection: React.FC<{ ideaId: Id<"ideas">; commentCount: number }> = ({ ideaId, commentCount }) => {
  const { userId } = useAuth();

  const groupByParent = (comments: Comment[]) => {
    const roots: Comment[] = [];
    const replies: { [key: string]: Comment[] } = {};
    comments.forEach(c => {
      if (c.parentCommentId) {
        if (!replies[c.parentCommentId]) replies[c.parentCommentId] = [];
        replies[c.parentCommentId].push(c);
      } else {
        roots.push(c);
      }
    });
    return { roots, replies };
  };

  const CommentItem: React.FC<{ comment: Comment; replies: Comment[]; ideaId: Id<"ideas">; level?: number }> = ({ comment, replies, ideaId, level = 0 }) => {
    const [showReply, setShowReply] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const addCommentMutation = useMutation(api.ideas.addComment);
    const deleteCommentMutation = useMutation(api.ideas.deleteComment);

    const handleReply = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyContent.trim() || !userId) return;
      setIsReplying(true);
      try {
        await addCommentMutation({
          ideaId,
          content: replyContent.trim(),
          parentCommentId: comment._id as Id<"comments">,
        });
        setReplyContent("");
        setShowReply(false);
      } catch (err) {
        console.error(err);
      } finally {
        setIsReplying(false);
      }
    };

    const handleDelete = async () => {
      if (!userId || !confirm("Are you sure you want to delete this comment? This action cannot be undone and will also remove any replies to this comment.")) return;
      setIsDeleting(true);
      try {
        await deleteCommentMutation({ commentId: comment._id as Id<"comments"> });
      } catch (err) {
        console.error(err);
      } finally {
        setIsDeleting(false);
      }
    };

    const getInitials = (name: string) => {
      return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
      <div className={`border-l-2 border-border pl-4 ${level > 0 ? "ml-4" : ""} py-4 ${level === 0 ? "bg-card rounded-xl p-4 transition-colors" : "rounded-xl"}`}>
        <div className="flex items-start space-x-4">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.author?.avatar} alt={comment.author?.name} />
            <AvatarFallback>{getInitials(comment.author?.name || comment.author?.username || "U")}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm">{comment.author?.name || comment.author?.username}</span>
              <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm leading-relaxed">{comment.content}</p>
            <div className="mt-2 flex items-center space-x-4 text-xs">
              {userId && <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowReply(!showReply)}>Reply</button>}
              {userId === comment.authorId && <button className="text-destructive hover:text-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" onClick={handleDelete} disabled={isDeleting} title="Delete comment">{isDeleting ? <Spinner size={14} /> : <Trash2 className="w-4 h-4" />}</button>}
            </div>
            {showReply && (
              <form onSubmit={handleReply} className="mt-4 flex space-x-2 rounded-xl">
                <Textarea
                  placeholder="Add a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="h-20 flex-1 resize-none rounded-xl"
                  maxLength={1200}
                />
                <div className="flex flex-col space-y-2">
                  <Button type="submit" disabled={!replyContent.trim() || isReplying} className="px-4 transition-colors">
                    {isReplying ? <Spinner size={16} /> : "Reply"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowReply(false)} className="transition-colors">Cancel</Button>
                </div>
              </form>
            )}
          </div>
        </div>
        {replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {replies.map(reply => (
              <CommentItem key={reply._id} comment={reply} replies={[]} ideaId={ideaId} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const comments = useQuery(api.ideas.getComments, { ideaId, limit: 100 });
  const addCommentMutation = useMutation(api.ideas.addComment);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !userId) return;
    setIsSubmitting(true);
    try {
      await addCommentMutation({
        ideaId,
        content: content.trim(),
      });
      setContent("");
      setError("");
    } catch (err) {
      setError("Failed to post comment");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { roots, replies } = groupByParent(comments || []);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 transition-colors">
        <h3 className="text-xl font-semibold mb-4">{commentCount} Comments</h3>
        {
          userId ? (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 rounded-xl">
              <Textarea
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-20 resize-none rounded-xl"
                disabled={isSubmitting}
                maxLength={1200}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex justify-between items-center">
                <Button type="submit" disabled={!content.trim() || isSubmitting} className="px-6 transition-colors">
                  {isSubmitting ? <Spinner size={18} /> : "Post Comment"}
                </Button>
                <span className="text-xs text-muted-foreground">{content.length}/1200</span>
              </div>
            </form>
          ) : (
            <p className="text-muted-foreground">Sign in to leave a comment.</p>
          )
        }
        <div className="space-y-4">
          {roots.map(comment => (
            <CommentItem key={comment._id} comment={comment} replies={replies[comment._id] || []} ideaId={ideaId} />
          ))}
          {comments === undefined && <div className="flex justify-center"><Spinner size={24} /></div>}
        </div>
      </div>
    </div>
  );
};

const IdeaContent: React.FC<{ idea: ConvexIdea }> = ({ idea }) => {
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

    // Available categories



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
    <div className="max-w-4xl mx-auto rounded-xl">
      {/* Title with Gradient */}
      <div className="mb-6 rounded-xl">
        {isEditing ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="text-4xl font-bold mb-4 border-0 bg-transparent text-transparent bg-gradient-to-r from-primary to-purple-600 bg-clip-text p-0"
            disabled={updating}
            maxLength={100}
            placeholder="Idea title"
          />
        ) : (
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-2 max-w-[70%]">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent leading-tight">
                {idea.title}
              </h1>
              <span className="inline-block bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20 text-primary font-medium px-3 py-1 rounded-full text-sm">
                {idea.category || 'General'}
              </span>
            </div>
            
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-3 bg-card/50 px-4 py-2 rounded-full border border-border/50">
                <div className="text-right">
                  <p className="font-medium text-sm">{idea.author?.name || idea.author?.username || "Unknown Author"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(idea.createdAt).toLocaleDateString()}</p>
                </div>
                <Avatar className="w-10 h-10 border-2 border-background">
                  <AvatarImage src={idea.author?.avatar} />
                  <AvatarFallback>{idea.author?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </div>

              {(idea.isAuthor || false) && !isEditing && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-8 w-8 p-0"
                    title="Edit idea"
                    disabled={isDeleting}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Delete idea"
                    disabled={isDeleting || updating}
                  >
                    {isDeleting ? <Spinner size={14} /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>



      {/* Description */}
      <div className="prose prose-lg max-w-none mb-8 p-6 bg-gradient-to-br from-card/50 to-card/30 rounded-xl border border-border transition-colors">
        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="text-muted-foreground leading-relaxed border-0 bg-transparent resize-none w-full"
            disabled={updating}
            maxLength={1200}
            placeholder="Idea description"
          />
        ) : (
          <p className="text-muted-foreground leading-relaxed">{idea.description}</p>
        )}
      </div>



      {isEditing && errorMsg && <p className="text-destructive text-sm mb-4">{errorMsg}</p>}

      {isEditing && (
        <div className="flex space-x-2 mb-8">
          <Button onClick={handleSave} disabled={!editedTitle.trim() || !editedDescription.trim() || updating}>
            {updating ? <Spinner size={18} /> : "Save"}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={updating}>
            Cancel
          </Button>
        </div>
      )}

    </div>
  ); }

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
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Kanban Board</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4" />
            <span>{groupedTodos.done.length} done</span>
            <span className="mx-1">•</span>
            <span>{groupedTodos.in_progress.length} in progress</span>
            <span className="mx-1">•</span>
            <span>{groupedTodos.todo.length} todo</span>
          </div>
        </div>

        {/* Create new todo form */}
        {canManageTodos && (
          <form onSubmit={handleCreateTodo} className="mb-6">
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input
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
          <div className="w-full min-h-[200px] max-h-[400px]">
            <KanbanProvider
              className="w-full"
              columns={kanbanColumns}
              data={kanbanData}
              onDataChange={handleDataChange}
            >
              {(column) => (
                <KanbanBoard id={column.id}>
                  <KanbanHeader>{column.name}</KanbanHeader>
                  <KanbanCards id={column.id}>
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
                          className="w-full"
                        >
                          {editingTodoId === todo?._id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="flex-1 h-8 text-sm"
                                maxLength={200}
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={!editingTitle.trim() || isUpdating}
                                className="text-green-600 hover:text-green-700 h-6 w-6 p-0"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                                className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className={`flex-1 text-sm ${
                                column.id === "done" ? "line-through text-muted-foreground" : ""
                              }`}>
                                {item.name}
                              </span>
                              <div className="flex items-center gap-1">
                                {todo?.canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditTodo(todo._id as Id<"todos">, todo.title)}
                                    className="text-muted-foreground hover:text-foreground h-6 w-6 p-0 opacity-60 hover:opacity-100 flex-shrink-0"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                )}
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
                          )}
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

const CalendarSection: React.FC<{ idea: ConvexIdea }> = ({ idea: _idea }: { idea: ConvexIdea }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  const todos = useQuery(api.todos.getTodosForCalendar) || [];

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Calendar</h3>
        </div>
        <CalendarProvider>
          <CalendarDate>
            <CalendarMonthPicker />
            <CalendarYearPicker start={2023} end={2026} />
            <CalendarDatePagination />
          </CalendarDate>
          <CalendarHeader />
          <CalendarBody features={todos}>
            {({ feature }) => <CalendarItem key={feature.id} feature={feature} />}
          </CalendarBody>
        </CalendarProvider>
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
    ideaId: string;
    message: string;
    parentId: string;
    authorId: string;
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
               <Button className="flex items-center gap-2" aria-label="Add sub-idea">
                 <Plus className="w-4 h-4" />
                 Add Sub-Idea
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
