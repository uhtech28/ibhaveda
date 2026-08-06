"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  title?: string
  description?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class VentureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("VentureErrorBoundary caught:", error, errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              {this.props.title || "Something went wrong"}
            </CardTitle>
            <CardDescription>
              {this.props.description || "An error occurred while loading this venture."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/my-ventures">
                  <Home className="mr-1 h-4 w-4" />
                  Back to Ventures
                </a>
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="mt-4 p-3 rounded bg-muted text-xs overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based wrapper for use in client components.
 * Returns { error, reset, isLoading } for manual error handling.
 */
export function useVentureError() {
  const router = useRouter()
  const reset = () => router.refresh()

  return {
    error: null,
    reset,
    isLoading: false,
  }
}
