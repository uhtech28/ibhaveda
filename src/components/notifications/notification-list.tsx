'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCheck, ExternalLink } from 'lucide-react'
// Simple utility to format relative time
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
}

const NotificationItem = ({ notification }: NotificationItemProps) => {
  const markAsRead = useMutation(api.notifications.markAsRead)

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id })
    }
    // Handle navigation to related item if needed
    if (notification.relatedId && notification.type === 'new_idea') {
      // Navigate to idea page
      window.location.href = `/idea/${notification.relatedId}`
    }
  }

  return (
    <Card
      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={notification.sender?.avatar} />
          <AvatarFallback>
            {notification.sender?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>

        <div className="flex items-center space-x-1">
          {!notification.isRead && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
          <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export const NotificationList = () => {
  const notifications = useQuery(api.notifications.getNotifications, { limit: 20 })
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  const checkDeadlinesAndNotify = useMutation(api.todos.checkDeadlinesAndNotify)

  // Check for deadline notifications when notifications are viewed
  useEffect(() => {
    if (notifications) {
      checkDeadlinesAndNotify()
    }
  }, [notifications, checkDeadlinesAndNotify])

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-sm">No notifications yet</p>
        <p className="text-xs mt-1">When someone shares an idea, you'll see it here.</p>
      </div>
    )
  }

  const unreadNotifications = notifications.filter((n: Notification) => !n.isRead)

  return (
    <div className="p-4 space-y-3">
      {unreadNotifications.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">
            {unreadNotifications.length} unread
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="text-xs"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        </div>
      )}

      {notifications.map((notification: Notification) => (
        <NotificationItem key={notification._id} notification={notification} />
      ))}
    </div>
  )
}