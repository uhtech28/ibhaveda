'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCheck, X, Bell, MessageCircle, UserPlus, Sparkles } from 'lucide-react'

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

type FilterType = "all" | "interactions" | "requests"
type ReadStatusFilter = "all" | "unread" | "read"

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
      case 'invitation_accepted':
      case 'invitation_rejected':
        return <Bell className="h-4 w-4 text-purple-500" />
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const handleClick = async () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id)
    }
    // Handle navigation to related item if needed
    if (notification.relatedId) {
      if (['new_idea', 'spark_received', 'comment_received', 'contribution_request_received'].includes(notification.type)) {
        window.location.href = `/idea/${notification.relatedId}`
      } else if (['invitation_received', 'invitation_accepted', 'invitation_rejected'].includes(notification.type)) {
        window.location.href = `/idea/${notification.relatedId}`
      }
    }
  }

  return (
    <Card
      className={`p-2 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors w-full max-w-full overflow-hidden ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-l-3 border-l-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-2 w-full min-w-0">
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {getNotificationIcon(notification.type)}
          <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
            <AvatarImage src={notification.sender?.avatar} />
            <AvatarFallback className="text-xs">
              {notification.sender?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
           <div className="flex items-center justify-between mb-1 min-w-0">
            <Badge variant="outline" className={`text-xs truncate max-w-28 flex-shrink-0 ${getNotificationBadgeColor(notification.type)}`}>
              {notification.type.replace('_', ' ')}
            </Badge>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {!notification.isRead && (
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-5 w-5 hover:bg-red-100 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss(notification._id)
                }}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-foreground break-words overflow-hidden mb-1 leading-tight max-w-full line-clamp-3">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground break-words overflow-hidden max-w-full">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </Card>
  )
}

export const NotificationList = () => {
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [readStatusFilter, setReadStatusFilter] = useState<ReadStatusFilter>("all")
  const [activeTab, setActiveTab] = useState<"all" | "interactions" | "requests">("all")

  const notifications = useQuery(api.notifications.getNotifications, {
    limit: 50,
    filterType,
    filterReadStatus: readStatusFilter
  })
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
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

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDismissAll = async () => {
    await dismissAllNotifications({
      filterType: filterType,
      filterReadStatus: readStatusFilter
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
      <div className="p-8 text-center text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No notifications yet</p>
        <p className="text-xs mt-1">When someone interacts with your ideas, you'll see it here.</p>
      </div>
    )
  }

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length
  const interactions = notifications.filter((n: Notification) =>
    ['spark_received', 'comment_received'].includes(n.type)
  )
  const requests = notifications.filter((n: Notification) =>
    ['contribution_request_received', 'contribution_request_accepted', 'contribution_request_rejected', 'invitation_received', 'invitation_accepted', 'invitation_rejected'].includes(n.type)
  )

  return (
    <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 max-w-full overflow-hidden">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
          <SelectTrigger className="w-full sm:w-36 text-xs sm:text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="interactions">Interactions</SelectItem>
            <SelectItem value="requests">Requests</SelectItem>
          </SelectContent>
        </Select>

        <Select value={readStatusFilter} onValueChange={(value: ReadStatusFilter) => setReadStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-36 text-xs sm:text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
            <SelectItem value="read">Read Only</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1 ml-auto">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs sm:text-sm px-2 h-8"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Read ({unreadCount})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDismissAll()}
            className="text-xs sm:text-sm px-2 h-8 text-red-600 hover:text-red-700"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="w-full overflow-hidden">
        <div className="flex h-10 items-center rounded-md bg-muted p-0.5 text-muted-foreground">
          <button
            className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-1.5 text-xs sm:text-sm font-medium transition-all min-w-0 ${
              activeTab === 'all' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'
            }`}
            onClick={() => setActiveTab('all')}
          >
            <span className="truncate">All ({notifications.length})</span>
          </button>
          <button
            className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-1.5 text-xs sm:text-sm font-medium transition-all min-w-0 ${
              activeTab === 'interactions' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'
            }`}
            onClick={() => setActiveTab('interactions')}
          >
            <span className="hidden sm:inline truncate">Interactions ({interactions.length})</span>
            <span className="sm:hidden truncate">Inter. ({interactions.length})</span>
          </button>
          <button
            className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-1.5 text-xs sm:text-sm font-medium transition-all min-w-0 ${
              activeTab === 'requests' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            <span className="hidden sm:inline truncate">Requests ({requests.length})</span>
            <span className="sm:hidden truncate">Req. ({requests.length})</span>
          </button>
        </div>

        <div className="mt-3 space-y-2 w-full overflow-hidden">
          {activeTab === 'all' && (
            <div className="space-y-2 w-full">
              {notifications.map((notification: Notification) => (
                <div key={notification._id} className="w-full overflow-hidden">
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDismiss={handleDismiss}
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'interactions' && (
            <div className="w-full">
              {interactions.length > 0 ? (
                <div className="space-y-2 w-full">
                  {interactions.map((notification: Notification) => (
                    <div key={notification._id} className="w-full overflow-hidden">
                      <NotificationItem
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDismiss={handleDismiss}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No interaction notifications</p>
                  <p className="text-xs mt-1">When someone sparks or comments on your ideas, they'll appear here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="w-full">
              {requests.length > 0 ? (
                <div className="space-y-2 w-full">
                  {requests.map((notification: Notification) => (
                    <div key={notification._id} className="w-full overflow-hidden">
                      <NotificationItem
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDismiss={handleDismiss}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <UserPlus className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No request notifications</p>
                  <p className="text-xs mt-1">When someone requests to contribute or invites you, they'll appear here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}