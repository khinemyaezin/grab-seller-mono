import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton"

const DEFAULT_ERROR_MESSAGE = "Failed to load."

type QueryStateProps = {
  isLoading: boolean
  isError: boolean
  loading?: ReactNode
  error?: ReactNode
  errorMessage?: string
  children: ReactNode
}

function QueryStateError({ message }: { message: string }) {
  return (
    <Card data-slot="query-state-error">
      <CardContent>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function QueryState({
  isLoading,
  isError,
  loading,
  error,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  children,
}: QueryStateProps) {
  if (isError) {
    return error ?? <QueryStateError message={errorMessage} />
  }

  if (isLoading) {
    return loading ?? <PageLoadingSkeleton />
  }

  return children
}

export { QueryState, type QueryStateProps }
