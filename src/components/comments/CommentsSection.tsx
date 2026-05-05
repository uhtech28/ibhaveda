"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, Send, MessageSquare } from "lucide-react";
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

const initialsOf = (name?: string) =>
  (name || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const CommentsSection: React.FC<CommentsSectionProps> = ({ ideaId }) => {
  const { userId } = useAuth();
  const comments = useQuery(api.ideas.getComments, { ideaId, limit: 100 });
  const addCommentMutation = useMutation(api.ideas.addComment);

  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!scrollRef.current || !comments) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [comments?.length]);

  // Auto-resize the textarea so it grows with the message but never overruns the dialog.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [content]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || !userId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addCommentMutation({ ideaId, content: content.trim() });
      setContent("");
      setError("");
    } catch (err) {
      setError("Couldn't post that comment. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupByParent = (list: Comment[]) => {
    const roots: Comment[] = [];
    const replies: Record<string, Comment[]> = {};
    list?.forEach((c) => {
      if (c.parentCommentId) {
        (replies[c.parentCommentId] ||= []).push(c);
      } else {
        roots.push(c);
      }
    });
    return { roots, replies };
  };

  const { roots, replies } = groupByParent(comments || []);

  return (
    <div className="grid h-full min-h-0 grid-rows-[1fr_auto] w-full">
      {/* Scrollable comment list */}
      <div
        ref={scrollRef}
        className="overflow-y-auto pr-1 -mr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {comments === undefined ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[#6B7280]">
            <Spinner size={20} />
            <span className="text-xs">Loading comments…</span>
          </div>
        ) : roots.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#6366F1]/10 ring-1 ring-[#6366F1]/20">
              <MessageSquare className="h-6 w-6 text-[#A5B4FC]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">No comments yet</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">Be the first to share your thoughts.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {roots.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                replies={replies[comment._id] || []}
                ideaId={ideaId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input — pinned bottom row of the grid */}
      <div className="pt-3 border-t border-white/8">
        {userId ? (
          <form onSubmit={handleSubmit}>
            <div className="relative rounded-xl border border-white/10 bg-[#0A0D12] transition-colors focus-within:border-[#6366F1]/45 focus-within:bg-[#111827]">
              <textarea
                ref={textareaRef}
                placeholder="Share your thoughts…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="block w-full resize-none rounded-xl bg-transparent px-4 pt-3 pb-9 text-sm leading-relaxed text-white placeholder:text-[#6B7280] outline-none focus:ring-0"
                disabled={isSubmitting}
                maxLength={1200}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="pointer-events-none absolute bottom-2.5 left-4 text-[10px] tabular-nums text-[#6B7280]">
                {content.length}/1200
              </div>
              <Button
                type="submit"
                size="icon"
                disabled={!content.trim() || isSubmitting}
                className="absolute bottom-2 right-2 h-8 w-8 rounded-lg bg-[#6366F1] text-white hover:bg-[#8B5CF6] disabled:opacity-40 disabled:hover:bg-[#6366F1]"
                title="Post comment (⌘ + Enter)"
              >
                {isSubmitting ? <Spinner size={14} /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {error && <p className="mt-2 text-[11px] text-rose-400">{error}</p>}
          </form>
        ) : (
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-center text-sm text-[#9CA3AF]">
            Sign in to join the conversation.
          </div>
        )}
      </div>
    </div>
  );
};

const CommentItem: React.FC<{
  comment: Comment;
  replies: Comment[];
  ideaId: Id<"ideas">;
  level?: number;
}> = ({ comment, replies, ideaId, level = 0 }) => {
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

  const isMine = userId === comment.authorId;

  return (
    <div className={`group ${level > 0 ? "ml-9" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 shrink-0 ring-1 ring-white/10">
          <AvatarImage src={comment.author?.avatar} alt={comment.author?.name} />
          <AvatarFallback className="bg-[#1B2440] text-[11px] text-white">
            {initialsOf(comment.author?.name || comment.author?.username)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-white/12">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-white">
                  {comment.author?.name || comment.author?.username || "Unknown"}
                </span>
                <span className="shrink-0 text-[11px] text-[#6B7280]">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
              </div>
              {isMine && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded p-1 text-[#6B7280] opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100 focus:opacity-100"
                  title="Delete"
                  type="button"
                >
                  {isDeleting ? <Spinner size={12} /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#E5E7EB]">
              {comment.content}
            </p>
          </div>

          {userId && (
            <div className="flex items-center gap-3 px-1 pt-1.5">
              <button
                type="button"
                className="text-[11px] font-medium text-[#9CA3AF] transition-colors hover:text-[#A5B4FC]"
                onClick={() => setShowReply(!showReply)}
              >
                {showReply ? "Cancel" : "Reply"}
              </button>
              {replies.length > 0 && (
                <span className="text-[11px] text-[#6B7280]">
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
          )}

          {showReply && (
            <form
              onSubmit={handleReply}
              className="mt-2 flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <textarea
                placeholder="Write a reply…"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[56px] flex-1 resize-none rounded-xl border border-white/8 bg-[#0A0D12] px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:border-[#6366F1]/45 focus:outline-none"
                maxLength={500}
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                disabled={!replyContent.trim() || isReplying}
                className="bg-[#6366F1] text-white hover:bg-[#8B5CF6]"
              >
                {isReplying ? <Spinner size={14} /> : "Reply"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="relative mt-3 pl-4">
          <div className="absolute bottom-0 left-[18px] top-0 w-px bg-white/8" />
          <div className="space-y-3">
            {replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                replies={[]}
                ideaId={ideaId}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
