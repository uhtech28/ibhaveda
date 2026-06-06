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
        return <Sparkles className="h-3 w-3 text-orange-500" />
      case 'comment_received':
        return <MessageCircle className="h-3 w-3 text-blue-500" />
      case 'contribution_request_received':
      case 'contribution_request_accepted':
      case 'contribution_request_rejected':
        return <UserPlus className="h-3 w-3 text-violet-500" />
      case 'invitation_received':
      case 'invitation_rejected':
        return <Bell className="h-3 w-3 text-purple-500" />
      case 'badge_awarded':
        return <Medal className="h-3 w-3 text-yellow-500" />
      default:
        return <Bell className="h-3 w-3 text-gray-500" />
    }
  }

  const isPendingInvitation = notification.type === 'invitation_received'
  const isPendingContrib = notification.type === 'contribution_request_received'
  const hasActionButtons = isPendingInvitation || isPendingContrib

  // ── Invitation hooks ───────────────────────────────────────────────────────
  const myInvitations = useQuery(api.invitations.getMyInvitations, isPendingInvitation ? {} : "skip")
  const acceptInvitationMutation = useMutation(api.invitations.acceptInvitation)
  const rejectInvitationMutation = useMutation(api.invitations.rejectInvitation)

  const matchedInvitation = isPendingInvitation && Array.isArray(myInvitations)
    ? myInvitations.find((inv: any) => inv.ideaId === notification.relatedId)
    : null

  // ── Contribution-request hooks ─────────────────────────────────────────────
  const incomingRequests = useQuery(api.contributionRequests.getIncomingRequests, isPendingContrib ? {} : "skip")
  const updateRequestStatus = useMutation(api.contributionRequests.updateRequestStatus)

  const matchedContribRequest = isPendingContrib && Array.isArray(incomingRequests)
    ? incomingRequests.find((r: any) => r.ideaId === notification.relatedId && r.status === 'pending')
    : null

  // ── Shared respond state ───────────────────────────────────────────────────
  const [respondingState, setRespondingState] = useState<'idle' | 'accepting' | 'rejecting'>('idle')
  const [respondError, setRespondError] = useState<string | null>(null)

  const handleInvitationAccept = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!matchedInvitation || respondingState !== 'idle') return
    setRespondingState('accepting')
    try {
      await acceptInvitationMutation({ invitationId: matchedInvitation._id })
      onMarkAsRead(notification._id)
      onDismiss(notification._id)
    } catch (err) {
      setRespondError(err instanceof Error ? err.message : 'Failed')
      setRespondingState('idle')
    }
  }

  const handleInvitationReject = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!matchedInvitation || respondingState !== 'idle') return
    setRespondingState('rejecting')
    try {
      await rejectInvitationMutation({ invitationId: matchedInvitation._id })
      onMarkAsRead(notification._id)
      onDismiss(notification._id)
    } catch (err) {
      setRespondError(err instanceof Error ? err.message : 'Failed')
      setRespondingState('idle')
    }
  }

  const handleContribAccept = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!matchedContribRequest || respondingState !== 'idle') return
    setRespondingState('accepting')
    try {
      await updateRequestStatus({ requestId: matchedContribRequest._id, status: 'accepted' })
      onMarkAsRead(notification._id)
      onDismiss(notification._id)
    } catch (err) {
      setRespondError(err instanceof Error ? err.message : 'Failed')
      setRespondingState('idle')
    }
  }

  const handleContribReject = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!matchedContribRequest || respondingState !== 'idle') return
    setRespondingState('rejecting')
    try {
      await updateRequestStatus({ requestId: matchedContribRequest._id, status: 'rejected' })
      onMarkAsRead(notification._id)
      onDismiss(notification._id)
    } catch (err) {
      setRespondError(err instanceof Error ? err.message : 'Failed')
      setRespondingState('idle')
    }
  }

  const handleClick = async () => {
    if (!notification.isRead) onMarkAsRead(notification._id)
    if (hasActionButtons) return
    if (!notification.relatedId) return
    const ideaTypes = ['new_idea','spark_received','comment_received','contribution_request_received','contribution_request_accepted','contribution_request_rejected','invitation_accepted','invitation_rejected']
    if (ideaTypes.includes(notification.type)) {
      window.location.href = `/idea/${notification.relatedId}`
    } else if (notification.type === 'badge_awarded') {
      const username = notification.sender?.username
      if (username) window.location.href = `/profile/${username}`
    }
  }

  return (
    <div
      className={`px-3 py-2 ${hasActionButtons ? '' : 'cursor-pointer'} hover:bg-muted/50 transition-colors w-full relative ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
      onClick={handleClick}
    >
      {/* Unread left bar */}
      {!notification.isRead && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />}

      <div className="flex items-start gap-2 w-full">
        {/* Avatar + type icon */}
        <div className="relative shrink-0 mt-0.5">
          <Avatar className="h-7 w-7 border border-border/50">
            <AvatarImage src={notification.sender?.avatar} />
            <AvatarFallback className="text-[10px]">
              {notification.sender?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 shadow-sm border border-border/40">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: message text + top-right controls */}
          <div className="flex items-start gap-1.5">
            <p className="text-xs text-foreground leading-snug flex-1 min-w-0">
              <span className="font-semibold">{notification.sender?.name || 'Someone'}</span>{' '}
              <span className="text-muted-foreground">
                {cleanMessage(notification.message, notification.sender?.name || '')}
              </span>
            </p>
            {/* Contribution requests: ✓ and ✗ replace the dismiss × */}
            {isPendingContrib && matchedContribRequest ? (
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <button
                  type="button"
                  onClick={handleContribAccept}
                  disabled={respondingState !== 'idle'}
                  aria-label="Accept"
                  title="Accept"
                  className="h-5 w-5 flex items-center justify-center rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
                >
                  {respondingState === 'accepting'
                    ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    : <Check className="h-2.5 w-2.5" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => { handleContribReject(e); onDismiss(notification._id) }}
                  disabled={respondingState !== 'idle'}
                  aria-label="Reject"
                  title="Reject"
                  className="h-5 w-5 flex items-center justify-center rounded bg-red-700 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
                >
                  {respondingState === 'rejecting'
                    ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    : <X className="h-2.5 w-2.5" />}
                </button>
              </div>
            ) : (
              /* All other notifications: standard dismiss × */
              <button
                className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors mt-0.5"
                onClick={(e) => { e.stopPropagation(); onDismiss(notification._id) }}
                aria-label="Dismiss"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>

          {isPendingInvitation && matchedInvitation && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={handleInvitationAccept}
                disabled={respondingState !== 'idle'}
                aria-label="Accept"
                title="Accept invitation"
                className="h-6 w-6 flex items-center justify-center rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors shrink-0"
              >
                {respondingState === 'accepting'
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Check className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={handleInvitationReject}
                disabled={respondingState !== 'idle'}
                aria-label="Decline"
                title="Decline invitation"
                className="h-6 w-6 flex items-center justify-center rounded bg-red-700 hover:bg-red-600 text-white disabled:opacity-50 transition-colors shrink-0"
              >
                {respondingState === 'rejecting'
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <X className="h-3 w-3" />}
              </button>
            </div>
          )}

          {respondError && <p className="text-[10px] text-red-400 mt-1">{respondError}</p>}

          {/* Row 3: time — bottom-right */}
          <div className="flex justify-end mt-0.5">
            <span className="text-[10px] text-muted-foreground/60">{formatRelativeTime(notification.createdAt)}</span>
          </div>
        </div>
      </div>
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
