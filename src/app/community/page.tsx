"use client"

import React from "react"
import { useQuery } from "convex/react"
import Link from "next/link"
import { api } from "../../../convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, Globe, AlertCircle } from "lucide-react"
import { useUser } from "@clerk/nextjs"

// User profile interface
interface UserProfile {
  _id: string
  clerkId: string
  username: string
  displayName: string
  bio?: string
  avatar?: string
  location?: string
  website?: string
  skills: string[]
  industry?: string
  completedOnboarding: boolean
  isActive: boolean
  role: string
  followersCount: number
  followingCount: number
  lastLoginAt?: number
  createdAt: number
  updatedAt: number
}

export default function CommunityPage() {
   const { isLoaded: isClerkUserLoaded } = useUser()

   // Convex data
   const users = useQuery(api.users.getAllUsers)

   // Loading state
   if (!isClerkUserLoaded || users === undefined) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="text-center">
           <Users className="w-8 h-8 animate-spin mx-auto mb-2" />
           <p>Loading community...</p>
         </div>
       </div>
     )
   }

   // Error state
   if (users === null) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Card className="max-w-md w-full">
           <CardContent className="pt-6">
             <div className="text-center">
               <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
               <h3 className="text-lg font-semibold mb-2">Failed to Load Community</h3>
               <p className="text-muted-foreground mb-4">
                 Unable to fetch community data. Please try refreshing the page.
               </p>
               <Button onClick={() => window.location.reload()}>
                 Try Again
               </Button>
             </div>
           </CardContent>
         </Card>
       </div>
     )
   }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Community</h1>
          <p className="text-muted-foreground mb-4">
            Discover amazing creators and innovators in our community
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{users?.length || 0} Members</span>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((user: UserProfile) => (
            <UserCard
              key={user._id}
              user={user}
            />
          ))}
        </div>

        {users?.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No users yet</h3>
            <p className="text-muted-foreground">
              Be the first to join our community!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// User Card Component
interface UserCardProps {
   user: UserProfile
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {

  return (
    <Link href={`/profile/${encodeURIComponent(user.username)}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback>
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{user.displayName}</h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>
        </CardHeader>

      <CardContent className="pt-0">
        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {user.bio}
          </p>
        )}

        {/* Industry */}
        {user.industry && (
          <Badge variant="secondary" className="text-xs mb-3">
            {user.industry}
          </Badge>
        )}

        {/* Skills */}
        {user.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {user.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {user.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{user.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{user.followersCount || 0} followers</span>
            <span>•</span>
            <span>{user.followingCount || 0} following</span>
          </div>
        </div>

        {/* Location & Website */}
        {(user.location || user.website) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user.location}
              </div>
            )}
            {user.website && (
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Website
              </div>
            )}
          </div>
        )}

        </CardContent>
      </Card>
    </Link>
  )
}