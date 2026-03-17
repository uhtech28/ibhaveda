"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children, ...props }: React.PropsWithChildren) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={true}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

