"use client"

import { Reuleaux } from 'ldrs/react'
import 'ldrs/react/Reuleaux.css'

export function Spinner({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center text-foreground ${className || ""}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <span
        className="absolute inset-0 rounded-full bg-primary/15 blur-md motion-safe:animate-pulse"
        aria-hidden="true"
      />
      <Reuleaux
        size={size}
        stroke={5}
        strokeLength={0.15}
        bgOpacity={0.14}
        speed={1.05}
        color="currentColor"
      />
    </div>
  )
}

// Alternative: Simple CSS ring spinner (backup)
export function RingLoader({ size = 40 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  )
}

// Alternative: Dots loader
export function DotsLoader({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-current rounded-full animate-pulse"
          style={{
            width: `${size / 4}px`,
            height: `${size / 4}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

// Alternative: Classic bounce loader
export function BounceLoader({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-current rounded-full"
          style={{
            width: `${size / 4}px`,
            height: `${size}px`,
            animationName: 'bounce',
            animationDuration: '0.5s',
            animationDelay: `${i * 0.1}s`,
            animationIterationCount: 'infinite',
            animationDirection: 'alternate'
          }}
        />
      ))}
    </div>
  )
}
