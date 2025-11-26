import React from "react";
import Image from "next/image";
import { MessageCircle, Users } from "lucide-react";

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
}

interface IdeaGridCardProps {
  idea: ConvexIdea;
  onClick?: () => void;
  onSpark?: (ideaId: string) => void;
  contributorsCount?: number;
  innerRef?: React.Ref<HTMLDivElement>;
}

export const IdeaGridCard: React.FC<IdeaGridCardProps> = ({ 
  idea, 
  onClick, 
  onSpark, 
  contributorsCount = 0, 
  innerRef 
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

  return (
    <div
      ref={innerRef}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Image or Gradient Background */}
      <div className="relative h-48 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl font-bold text-foreground/80 shadow-2xl ring-1 ring-white/30">
            {idea.title.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Tags - Top Left - Clean & Minimal */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[90%]">
          {/* Combine and limit tags to reduce clutter */}
          {[...industries, ...skills].slice(0, 2).map((tag, i) => (
            <span key={`tag-${i}`} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-background/40 backdrop-blur-md text-foreground/90 border border-white/10 shadow-sm">
              {tag}
            </span>
          ))}
          {([...industries, ...skills].length > 2) && (
            <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-background/20 backdrop-blur-md text-foreground/80 border border-white/10">
              +{([...industries, ...skills].length - 2)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {idea.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-6 leading-relaxed flex-1">
          {idea.description}
        </p>

        {/* Footer: Author (Left) and Actions (Right) */}
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-border/50">
          
          {/* Bottom Left: Author */}
          <div className="flex items-center space-x-2">
            {idea.author?.avatar ? (
              <Image
                src={idea.author.avatar}
                alt={idea.author?.name || idea.author?.username || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-border"
                width={32}
                height={32}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold border border-border">
                {getInitials(idea.author?.name || idea.author?.username || 'Unknown')}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">
                {idea.author?.name || idea.author?.username || 'Unknown'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                @{idea.author?.username || 'user'}
              </span>
            </div>
          </div>

          {/* Bottom Right: Actions (Icons & Numbers separated) */}
          <div className="flex items-center gap-3">
            
            {/* Sparks */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSpark?.(idea._id);
                }}
                className="p-1.5 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                title="Spark this idea"
              >
                <span className="text-lg">✨</span>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Show list of sparkers
                }}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground hover:underline"
              >
                {idea.sparkCount || 0}
              </button>
            </div>

            {/* Comments */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Open comments
                }}
                className="p-1.5 rounded-full hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors"
                title="View comments"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Show list of comments
                }}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground hover:underline"
              >
                {idea.commentCount || 0}
              </button>
            </div>

            {/* Contributors */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Send contribution request
                }}
                className="p-1.5 rounded-full hover:bg-purple-50 text-muted-foreground hover:text-purple-500 transition-colors"
                title="Contribute"
              >
                <Users className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Show list of contributors
                }}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground hover:underline"
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
