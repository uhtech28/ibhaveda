'use client'
import React, { useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Image from 'next/image';
import { MessageCircle, GitBranch, Users } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  description: string;
  author?: string;
  authorName?: string;
  authorAvatar?: string;
  imageUrl?: string;
  categories?: string[];
  visibility?: string;
  createdAt?: string;
  sparkCount?: number;
  sparkred?: boolean;
  userHasSparked?: boolean;
  commentsCount?: number;
}

interface IdeaSpotlightCardProps {
  idea: Idea;
  onClick?: () => void;
  onSpark?: (ideaId: string) => void;
  onContribute?: (ideaId: string) => void;
  contributorsCount?: number;
}

const IdeaSpotlightCard: React.FC<IdeaSpotlightCardProps> = ({ idea, onClick, onSpark, onContribute, contributorsCount = 0 }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const controls = useAnimation();

  // Format the date to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get initials for avatar if no image is provided
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a simple icon based on the category
  const getCategoryIcon = (category: string) => {
    const firstChar = category.charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
        {firstChar}
      </div>
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => controls.start({ opacity: 1 });
  const handleMouseLeave = () => controls.start({ opacity: 0 });

  // Simple SparkButton component
  const SparkButton = ({ isSparkred, sparkCount, onSpark }: {
    isSparkred: boolean;
    sparkCount: number;
    onSpark: () => void;
  }) => (
    <button
      onClick={onSpark}
      className={`flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors ${isSparkred ? 'text-red-500' : ''}`}
    >
      <span className="text-sm">🔥</span>
      <span className="text-sm font-medium">{sparkCount}</span>
    </button>
  );

  // Simple CommentPreview component
  const CommentPreview = ({ commentCount, onViewAll }: {
    commentCount: number;
    onViewAll: () => void;
  }) => (
    <div className="text-xs text-muted-foreground">
      {commentCount > 0 && (
        <button onClick={onViewAll}>
          View all {commentCount} comments
        </button>
      )}
    </div>
  );

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-lg
        dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-100 dark:hover:border-neutral-600
        border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0"
        animate={controls}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, 
            rgba(99, 102, 241, 0.15), transparent 40%)`,
        }}
      />
      
      {/* Card Content */}
      <div className="relative p-6">
        {/* Header with category, visibility, and contributor badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getCategoryIcon((idea.categories && idea.categories[0]) || 'General')}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {(idea.categories && idea.categories[0]) || 'General'}
            </span>
            {contributorsCount > 0 && (
              <div
                className="flex items-center space-x-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 cursor-pointer hover:opacity-80 transition-opacity"
                title={`${contributorsCount} contributor${contributorsCount !== 1 ? 's' : ''}`}
              >
                <Users className="w-3 h-3" />
                <span>{contributorsCount}</span>
              </div>
            )}
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 capitalize">
            {idea.visibility || 'public'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-3 line-clamp-2 leading-tight">
          {idea.title ?? ''}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-5 leading-relaxed">
          {idea.description ?? ''}
        </p>

        {/* Author info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {idea.authorAvatar ? (
              <Image
                src={idea.authorAvatar}
                alt={idea.authorName || 'Author'}
                className="w-8 h-8 rounded-full object-cover"
                width={32}
                height={32}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-medium">
                {getInitials(idea.authorName || idea.author || 'Unknown')}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">{idea.authorName || idea.author || 'Unknown Author'}</span>
            </div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {idea.createdAt ? formatDate(new Date(idea.createdAt).toISOString()) : 'Unknown date'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>

        {/* Spark, Contribute, and Comment Preview */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div onClick={(e) => e.stopPropagation()}>
                <SparkButton
                  isSparkred={idea.sparkred || idea.userHasSparked || false}
                  sparkCount={idea.sparkCount || 0}
                  onSpark={() => onSpark?.(idea.id)}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContribute?.(idea.id);
                }}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <GitBranch className="w-4 h-4" />
                <span className="text-sm font-medium">Contribute</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContribute?.(idea.id);
                }}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                title={`View contributors (${contributorsCount})`}
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{contributorsCount}</span>
              </button>
              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{idea.commentsCount || 0}</span>
              </div>
            </div>
          </div>
          <CommentPreview
            commentCount={idea.commentsCount || 0}
            onViewAll={() => onClick?.()}
          />
        </div>
      </div>
    </div>
  );
};

export default IdeaSpotlightCard;