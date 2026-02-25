"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface CommentsSectionProps {
  ideaId: Id<"ideas">;
  commentCount: number;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ ideaId }) => {
  const { userId } = useAuth();
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

  const groupByParent = (comments: Comment[]) => {
    const roots: Comment[] = [];
    const replies: { [key: string]: Comment[] } = {};
    comments?.forEach(c => {
      if (c.parentCommentId) {
        if (!replies[c.parentCommentId]) replies[c.parentCommentId] = [];
        replies[c.parentCommentId].push(c);
      } else {
        roots.push(c);
      }
    });
    return { roots, replies };
  };

  const { roots, replies } = groupByParent(comments || []);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {comments === undefined ? (
          <div className="flex justify-center py-8"><Spinner size={24} /></div>
        ) : roots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
            <p>No comments yet.</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          roots.map(comment => (
            <CommentItem
              key={comment._id}
              comment={comment}
              replies={replies[comment._id] || []}
              ideaId={ideaId}
            />
          ))
        )}
      </div>

      {/* Sticky Bottom Input */}
      <div className="pt-4 mt-auto border-t border-border bg-background sticky bottom-0 z-10">
        {userId ? (
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] pr-12 resize-none rounded-xl bg-muted/30 focus:bg-background transition-colors"
              disabled={isSubmitting}
              maxLength={1200}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{content.length}/1200</span>
              <Button
                type="submit"
                size="icon"
                disabled={!content.trim() || isSubmitting}
                className="h-8 w-8 rounded-lg"
              >
                {isSubmitting ? <Spinner size={14} /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            {error && <p className="text-destructive text-xs mt-2">{error}</p>}
          </form>
        ) : (
          <div className="p-4 bg-muted/30 rounded-xl text-center text-sm text-muted-foreground">
            Please sign in to join the conversation.
          </div>
        )}
      </div>
    </div>
  );
};

const CommentItem: React.FC<{ comment: Comment; replies: Comment[]; ideaId: Id<"ideas">; level?: number }> = ({ comment, replies, ideaId, level = 0 }) => {
  const { userId } = useAuth();
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
    if (!userId || !confirm("Delete this comment?")) return;
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
    <div className={`group ${level > 0 ? "ml-8 mt-3" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 shrink-0 border border-border">
          <AvatarImage src={comment.author?.avatar} alt={comment.author?.name} />
          <AvatarFallback className="text-[10px]">{getInitials(comment.author?.name || comment.author?.username || "U")}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{comment.author?.name || comment.author?.username}</span>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
            </div>
            {userId === comment.authorId && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                title="Delete"
              >
                {isDeleting ? <Spinner size={12} /> : <Trash2 className="w-3 h-3" />}
              </button>
            )}
          </div>

          <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-4 pt-1">
            {userId && (
              <button
                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowReply(!showReply)}
              >
                Reply
              </button>
            )}
          </div>

          {showReply && (
            <form onSubmit={handleReply} className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] flex-1 resize-none text-sm bg-muted/30"
                maxLength={500}
                autoFocus
              />
              <div className="flex flex-col gap-2">
                <Button type="submit" size="sm" disabled={!replyContent.trim() || isReplying}>
                  {isReplying ? <Spinner size={14} /> : "Reply"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowReply(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="mt-3 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />
          {replies.map(reply => (
            <CommentItem key={reply._id} comment={reply} replies={[]} ideaId={ideaId} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
