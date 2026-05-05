"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lightbulb, Sparkles, UserPlus, Check, GitPullRequest } from "lucide-react";
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
  ideasContributed?: number;
}

interface CollaboratorCardProps {
  profile: UserProfile;
  onInvite?: (userId: string, message?: string) => void;
  isInvited?: boolean;
}

export const CollaboratorCard: React.FC<CollaboratorCardProps> = ({
  profile,
  onInvite,
  isInvited = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = () => {
    onInvite?.(profile._id, message.trim() || undefined);
    setDialogOpen(false);
    setMessage("");
  };

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
      <div className="grid grid-cols-3 gap-2 mb-6 relative z-10">
        <div className="bg-muted/30 rounded-xl p-2 flex flex-col items-center justify-center border border-border/50 group-hover:border-primary/10 transition-colors">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <Lightbulb className="w-3 h-3" />
            <span>Created</span>
          </div>
          <span className="font-bold text-base">{profile.ideasCreated || 0}</span>
        </div>
        <div className="bg-muted/30 rounded-xl p-2 flex flex-col items-center justify-center border border-border/50 group-hover:border-primary/10 transition-colors">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <Sparkles className="w-3 h-3 text-orange-500" />
            <span>Sparked</span>
          </div>
          <span className="font-bold text-base">{profile.ideasSparked || 0}</span>
        </div>
        <div className="bg-muted/30 rounded-xl p-2 flex flex-col items-center justify-center border border-border/50 group-hover:border-primary/10 transition-colors">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
            <GitPullRequest className="w-3 h-3 text-blue-500" />
            <span>Contrib</span>
          </div>
          <span className="font-bold text-base">{profile.ideasContributed || 0}</span>
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
          onClick={() => !isInvited && setDialogOpen(true)}
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

      {/* Connect message dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Connect with {profile.displayName}</DialogTitle>
            <DialogDescription>
              Add a short note so they know why you'd like to collaborate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor={`connect-message-${profile._id}`} className="text-sm font-medium">
              Message <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id={`connect-message-${profile._id}`}
              rows={4}
              maxLength={500}
              placeholder={`Hi ${profile.displayName}, I really like your work on ${profile.skills?.[0] || "your skills"}. I'd love to collaborate...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setMessage("");
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSend}>
              <UserPlus className="w-4 h-4 mr-2" />
              Send Connect Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
