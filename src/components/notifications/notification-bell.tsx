'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationList } from './notification-list'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'

export const NotificationBell = () => {
  const unreadCount = useQuery(api.notifications.getUnreadCount)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount && unreadCount > 0 && (
          <Badge
            className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] rounded-full p-0 text-[10px] leading-none font-semibold flex items-center justify-center px-1 bg-red-500 text-white border-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {mounted && open &&
        createPortal(
          <>
            <div
              aria-hidden
              className="fixed inset-0 z-[55] bg-black/40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="false"
              aria-label="Notifications"
              className="
                fixed z-[60] overflow-hidden
                left-3 right-3 top-[64px]
                lg:left-auto lg:right-4 lg:top-[72px] lg:w-[24rem]
                bg-background border border-border/60 rounded-xl shadow-2xl
              "
            >
              <ScrollArea className="h-[min(45vh,360px)] bg-background">
                <NotificationList onClose={() => setOpen(false)} />
              </ScrollArea>
            </div>
          </>,
          document.body
        )}
    </>
  )
}