'use client'

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { Sparkles, MessageCircle, UserPlus, Bell, X, Medal, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

function cleanMessage(raw: string, senderName: string): string {
  return raw
    .replace(senderName, '')
    .replace(/\s+your idea\s+/gi, ' ')
    .replace(/requested to contribute to/gi, 'wants to contribute to')
    .replace(/you earned the\s+/gi, 'gained ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

type Notification = {
  _id: Id<"notifications">
  message: string
  isRead: boolean
  createdAt: number
  type: string
  relatedId?: string
  sender: {
    name: string
    username: string
    avatar?: string
  } | null
}


interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: Id<"notifications">) => void
  onDismiss: (id: Id<"notifications">) => void
}

const NotificationItem = ({ notification, onMarkAsRead, onDismiss }: NotificationItemProps) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'spark_received':
        return <Sparkles className="h-4 w-4 text-orange-500" />
      case 'comment_received':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'contribution_request_received':
      case 'contribution_request_accepted':
      case 'contribution_request_rejected':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'invitation_received':
      case 'invitation_rejected':
        return <Bell className="h-4 w-4 text-purple-500" />
      case 'badge_awarded':
        return <Medal className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'spark_received':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'comment_received':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'contribution_request_received':
      case 'contribution_request_accepted':
      case 'contribution_request_rejected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'invitation_received':
      case 'invitation_accepted':
      case 'invitation_rejected':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'badge_awarded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const isPendingInvitation = notification.type === 'invitation_received'

  // Real Convex hooks for accept/reject — only fetched/used for invitation rows.
  const myInvitations = useQuery(
    api.invitations.getMyInvitations,
    isPendingInvitation ? {} : "skip"
  )
  const acceptInvitationMutation = useMutation(api.invitations.acceptInvitation)
  const rejectInvitationMutation = useMutation(api.invitations.rejectInvitation)
  const [respondingState, setRespondingState] = useState<'idle' | 'accepting' | 'rejecting'>('idle')
  const [respondError, setRespondError] = useState<string | null>(null)

  // Match the notification's relatedId (the idea id) to a pending invitation.
  const matchedInvitation = isPendingInvitation && Array.isArray(myInvitations)
    ? myInvitations.find((inv: any) => inv.ideaId === notification.relatedId)
    : null

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!matchedInvitation || respondingState !== 'idle') return
    setRespondingState('accepting')
    setRespondError(null)
    try {
      await acceptInvitationMutation({ invitationId: matchedInvitation._id })
      onMarkAsRead(notification._id)
      onDismiss(notification._id)
    } catch (err) {
      setRespondError(err instanceof Error ? err.message : 'Failed to accept invitation')
      setRespondingState('idle')
    }
  }

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!matchedInvitation || respondingState !== 'idle') return
    setRespondingState('rejecting')
    setRespondError(null)
    try {
      await rejectInvitationMutation({ invitationId: matchedInvitation._id })
      onMarkAsRead(notification._id)
      onDismiss(notification._id)
    } catch (err) {
      setRespondError(err instanceof Error ? err.message : 'Failed to decline invitation')
      setRespondingState('idle')
    }
  }

  const handleClick = async () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id)
    }
    // Pending invitations stay on this page so the inline ✓/✗ buttons can do
    // their job. For everything else, drill into the idea or sender profile.
    if (isPendingInvitation) return
    if (notification.relatedId) {
      // Anything tied to an idea — sparks, comments, contribution requests
      // (received/accepted/rejected) and invitation responses — drills into
      // that idea's page.
      const ideaTypes = [
        'new_idea',
        'spark_received',
        'comment_received',
        'contribution_request_received',
        'contribution_request_accepted',
        'contribution_request_rejected',
        'invitation_accepted',
        'invitation_rejected',
      ];
      if (ideaTypes.includes(notification.type)) {
        window.location.href = `/idea/${notification.relatedId}`
      } else if (notification.type === 'badge_awarded') {
        const username = notification.sender?.username;
        if (username) window.location.href = `/profile/${username}`;
      }
    }
  }

  return (
    <div
      className={`p-3 sm:p-4 ${isPendingInvitation ? '' : 'cursor-pointer'} hover:bg-muted/50 transition-colors w-full relative group ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''
        }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3 w-full">
        <div className="relative shrink-0 mt-0.5">
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarImage src={notification.sender?.avatar} />
            <AvatarFallback className="text-xs">
              {notification.sender?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border/50">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-foreground leading-snug">
              <span className="font-semibold">{notification.sender?.name || 'Someone'}</span>{' '}
              <span className="text-muted-foreground">
                {cleanMessage(notification.message, notification.sender?.name || '')}
              </span>
            </p>
            <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap mt-0.5">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>

          {isPendingInvitation && matchedInvitation && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <Button
                type="button"
                size="sm"
                onClick={handleAccept}
                disabled={respondingState !== 'idle'}
                aria-label="Accept invitation"
                title="Accept"
                className="h-7 px-2.5 gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
              >
                {respondingState === 'accepting'
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Check className="h-3.5 w-3.5" />}
                <span className="text-xs">Accept</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleReject}
                disabled={respondingState !== 'idle'}
                aria-label="Decline invitation"
                title="Decline"
                className="h-7 px-2.5 gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25"
              >
                {respondingState === 'rejecting'
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <X className="h-3.5 w-3.5" />}
                <span className="text-xs">Decline</span>
              </Button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                onDismiss(notification._id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
            </div>
          </div>

          {respondError && (
            <p className="text-[11px] text-red-400 mt-1">{respondError}</p>
          )}
        </div>
      </div>
      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
      )}
    </div>
  )
}

export const NotificationList = ({ onClose }: { onClose?: () => void }) => {
  const [activeTab, setActiveTab] = useState<"all" | "interactions" | "requests">("all")

  const notifications = useQuery(api.notifications.getNotifications, {
    limit: 50
  })
  const dismissAllNotifications = useMutation(api.notifications.dismissAllNotifications)
  const markAsRead = useMutation(api.notifications.markAsRead)
  const dismissNotification = useMutation(api.notifications.dismissNotification)
  const checkDeadlinesAndNotify = useMutation(api.todos.checkDeadlinesAndNotify)

  // Check for deadline notifications when notifications are viewed
  useEffect(() => {
    if (notifications) {
      checkDeadlinesAndNotify()
    }
  }, [notifications, checkDeadlinesAndNotify])

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    await markAsRead({ notificationId })
  }

  const handleDismiss = async (notificationId: Id<"notifications">) => {
    await dismissNotification({ notificationId })
  }

  const handleDismissAll = async () => {
    await dismissAllNotifications({
      filterType: "all",
      filterReadStatus: "all"
    })
  }

  if (!notifications) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm">Loading notifications...</p>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background sticky top-0 z-10">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {onClose && (
            <button onClick={onClose} aria-label="Close notifications" className="flex h-6 w-6 items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors focus:outline-none">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <div className="bg-muted/50 p-4 rounded-full mb-4">
            <Bell className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="text-xs mt-1 max-w-[200px]">When someone interacts with your ideas, you'll see it here.</p>
        </div>
      </div>
    )
  }

  const interactions = notifications.filter((n: Notification) =>
    ['spark_received', 'comment_received'].includes(n.type)
  )
  const requests = notifications.filter((n: Notification) =>
    ['contribution_request_received', 'contribution_request_accepted', 'contribution_request_rejected', 'invitation_received', 'invitation_accepted', 'invitation_rejected'].includes(n.type)
  )

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-semibold text-sm">Notifications</h3>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismissAll()}
              className="h-6 text-[11px] text-muted-foreground hover:text-red-600 hover:bg-red-50 px-1.5"
            >
              Clear
            </Button>
          )}
          {onClose && (
            <button onClick={onClose} aria-label="Close notifications" className="flex h-6 w-6 items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors focus:outline-none">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 bg-background border-b">
        <div className="flex p-1 bg-muted/50 rounded-lg">
          <button
            className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'all'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            onClick={() => setActiveTab('all')}
          >
            All
            <span className="ml-1.5 text-[10px] opacity-70 bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
              {notifications.length}
            </span>
          </button>
          <button
            className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'interactions'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            onClick={() => setActiveTab('interactions')}
          >
            Interactions
            {interactions.length > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70 bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                {interactions.length}
              </span>
            )}
          </button>
          <button
            className={`flex-1 flex items-center justify-center py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'requests'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            onClick={() => setActiveTab('requests')}
          >
            Requests
            {requests.length > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70 bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'all' && (
          <div className="divide-y divide-border/50">
            {notifications.map((notification: Notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="divide-y divide-border/50">
            {interactions.length > 0 ? (
              interactions.map((notification: Notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDismiss={handleDismiss}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground">
                <div className="bg-muted/50 p-3 rounded-full mb-3">
                  <MessageCircle className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-sm font-medium">No interactions yet</p>
                <p className="text-xs mt-1 max-w-[200px]">When someone sparks or comments on your ideas, they'll appear here.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="divide-y divide-border/50">
            {requests.length > 0 ? (
              requests.map((notification: Notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDismiss={handleDismiss}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground">
                <div className="bg-muted/50 p-3 rounded-full mb-3">
                  <UserPlus className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-sm font-medium">No requests yet</p>
                <p className="text-xs mt-1 max-w-[200px]">Contribution requests and invitations will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}