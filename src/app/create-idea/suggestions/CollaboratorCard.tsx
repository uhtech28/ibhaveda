"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, UserPlus, Check } from "lucide-react";
import { motion } from "framer-motion";

interface UserProfile {
  _id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  industry?: string;
  skills: string[];
  ideasCreated?: number;
  ideasSparked?: number;
}

interface CollaboratorCardProps {
  profile: UserProfile;
  onInvite?: (userId: string) => void;
  isInvited?: boolean;
}

export const CollaboratorCard: React.FC<CollaboratorCardProps> = ({
  profile,
  onInvite,
  isInvited = false,
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 flex flex-col h-full"
    >
      {/* Background Gradient Blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

      {/* Header: Avatar & Info */}
      <div className="flex items-start gap-4 mb-4 relative z-10">
        <Avatar className="w-16 h-16 border-2 border-background shadow-lg shrink-0">
          <AvatarImage src={profile.avatar} alt={profile.displayName} className="object-cover" />
          <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
            {profile.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">
            {profile.displayName}
          </h3>
          <p className="text-sm text-muted-foreground font-medium truncate">@{profile.username}</p>
          
          {profile.industry && (
            <Badge variant="secondary" className="mt-2 text-[10px] h-5 px-2 bg-muted/80 text-muted-foreground font-medium">
              {profile.industry}
            </Badge>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="mb-6 relative z-10 flex-1">
        <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed h-10">
          {profile.bio || "No bio available"}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
        <div className="bg-muted/30 rounded-xl p-3 flex flex-col items-center justify-center border border-border/50 group-hover:border-primary/10 transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Created</span>
          </div>
          <span className="font-bold text-lg">{profile.ideasCreated || 0}</span>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 flex flex-col items-center justify-center border border-border/50 group-hover:border-primary/10 transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Sparked</span>
          </div>
          <span className="font-bold text-lg">{profile.ideasSparked || 0}</span>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-6 relative z-10 h-14 content-start overflow-hidden">
        {profile.skills.slice(0, 4).map((skill, i) => (
          <Badge 
            key={i} 
            variant="outline" 
            className="text-[10px] px-2 py-0.5 h-6 bg-background/50 border-border/60"
          >
            {skill}
          </Badge>
        ))}
        {profile.skills.length > 4 && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-6 bg-background/50 border-border/60 text-muted-foreground">
            +{profile.skills.length - 4}
          </Badge>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-auto relative z-10">
        <Button 
          className={`w-full rounded-xl h-10 font-semibold shadow-sm transition-all duration-300 ${
            isInvited 
              ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20" 
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20 hover:shadow-lg"
          }`}
          onClick={() => onInvite?.(profile._id)}
          disabled={isInvited}
        >
          {isInvited ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Invited
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Connect
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};
