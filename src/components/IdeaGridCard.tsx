import React from "react";
import Image from "next/image";
import { MessageCircle, Users, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type ConvexIdea = {
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
  author?: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string;
  } | null;
  contributionCount?: number;
  industries?: string;
  attachments?: { name: string; type: string; size: number; url: string; fileId: string }[];
}

interface IdeaGridCardProps {
  idea: ConvexIdea;
  onClick?: () => void;
  onSpark?: (ideaId: string) => void;
  contributorsCount?: number;
  innerRef?: React.Ref<HTMLDivElement>;
  onTagClick?: (tag: string) => void;
  onCommentClick?: (ideaId: string) => void;
  onContributeClick?: (ideaId: string) => void;
}

export const IdeaGridCard: React.FC<IdeaGridCardProps> = ({
  idea,
  onClick,
  onSpark,
  contributorsCount = 0,
  innerRef,
  onTagClick,
  onCommentClick,
  onContributeClick
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Parse categories (skills) and industries
  const skills = idea.category ? idea.category.split(',').map(s => s.trim()) : [];
  const industries = idea.industries ? idea.industries.split(',').map(i => i.trim()) : [];

  const firstImageAttachment = Array.isArray(idea.attachments)
    ? idea.attachments.find(att => (att.type || "").toLowerCase().startsWith("image/"))
    : undefined;

  return (
    <div
      ref={innerRef}
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card text-card-foreground transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Image or Gradient Background - Top Section */}
      <div className="relative h-48 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out">
          {firstImageAttachment ? (
            <Image
              src={firstImageAttachment.url}
              alt={idea.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl font-bold text-foreground/80 shadow-2xl ring-1 ring-white/30">
              {idea.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Top Left: Title */}
        <div className="absolute top-4 left-4 max-w-[50%] z-10">
          <h3 className="text-xs font-bold leading-tight text-foreground/90 bg-background/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm truncate text-left">
            {idea.title}
          </h3>
        </div>

        {/* Top Right: Author */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/30 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shadow-sm z-10 max-w-[45%]">
          {idea.author?.avatar ? (
            <Image
              src={idea.author.avatar}
              alt={idea.author?.name || idea.author?.username || 'User'}
              className="w-6 h-6 rounded-full object-cover border border-white/20 shrink-0"
              width={24}
              height={24}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary border border-white/20 shrink-0">
              {getInitials(idea.author?.name || idea.author?.username || 'U')}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold text-foreground/90 leading-none truncate">
              {idea.author?.name || idea.author?.username || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex flex-col flex-1 gap-3">

        {/* Description */}

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {idea.description}
        </p>

        {/* Tags Section - Below Content */}
        {/* Tags Section - Below Content */}
        <div className="flex flex-col gap-2 mt-auto">
          {/* Industries - Purple/Pink Theme */}
          {industries.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {industries.slice(0, 2).map((tag, i) => (
                <button
                  key={`ind-${i}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tag);
                  }}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 transition-colors truncate max-w-[120px]"
                >
                  {tag}
                </button>
              ))}
              {industries.length > 2 && (
                <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-purple-500/5 text-purple-600/70 border border-purple-500/10">
                  +{industries.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Skills - Blue/Indigo Theme */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {skills.slice(0, 2).map((tag, i) => (
                <button
                  key={`skill-${i}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tag);
                  }}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors truncate max-w-[120px]"
                >
                  {tag}
                </button>
              ))}
              {skills.length > 2 && (
                <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-blue-500/5 text-blue-600/70 border border-blue-500/10">
                  +{skills.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Date (Left) and Actions (Right) */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-2">

          {/* Bottom Left: Date */}
          <span className="text-[10px] font-medium text-muted-foreground">
            {formatDistanceToNow(idea.createdAt, { addSuffix: true })}
          </span>

          {/* Bottom Right: Actions (Icons & Numbers separated) */}
          <div className="flex items-center gap-4">

            {/* Sparks */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSpark?.(idea._id);
                }}
                className="p-1.5 rounded-full hover:bg-orange-50 text-muted-foreground hover:text-orange-500 transition-colors group/spark"
                title="Spark this idea"
              >
                <Sparkles className="w-4 h-4 group-hover/spark:fill-orange-500 transition-all" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Show list of sparkers
                }}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline min-w-[12px] text-center"
              >
                {idea.sparkCount || 0}
              </button>
            </div>

            {/* Comments */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick?.(idea._id);
                }}
                className="p-1.5 rounded-full hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors"
                title="View comments"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick?.(idea._id);
                }}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline min-w-[12px] text-center"
              >
                {idea.commentCount || 0}
              </button>
            </div>

            {/* Contributors */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContributeClick?.(idea._id);
                }}
                className="p-1.5 rounded-full hover:bg-green-50 text-muted-foreground hover:text-green-500 transition-colors"
                title="Contribute"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Show list of contributors
                }}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline min-w-[12px] text-center"
              >
                {contributorsCount}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
