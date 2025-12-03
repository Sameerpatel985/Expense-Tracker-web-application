"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/components/ui/ToastContext"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60 * 1000, // 10 minutes - keep data fresh longer
        gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
        refetchOnWindowFocus: false,
        refetchOnReconnect: false, // Disable refetch on reconnect to prevent delays
        retry: 1, // Reduce retries to speed up failures
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
