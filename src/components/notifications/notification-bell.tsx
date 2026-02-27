'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationList } from './notification-list'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'

export const NotificationBell = () => {
  const unreadCount = useQuery(api.notifications.getUnreadCount)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent data-notification className="w-[calc(100vw-2rem)] sm:w-96 md:w-[28rem] lg:w-[32rem] p-0" align="end" sideOffset={8} avoidCollisions={false}>
        <ScrollArea className="h-[60vh] sm:h-[500px] lg:h-[700px]">
          <NotificationList />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}