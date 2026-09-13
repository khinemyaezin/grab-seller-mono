import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { QueryState } from "./query-state"

afterEach(cleanup)

describe("QueryState", () => {
  it("renders the default error card", () => {
    render(
      <QueryState isLoading={false} isError>
        <p>Ready</p>
      </QueryState>,
    )

    expect(screen.getByText("Failed to load.")).toBeTruthy()
    expect(screen.queryByText("Ready")).toBeNull()
  })

  it("renders the default loading skeleton", () => {
    render(
      <QueryState isLoading isError={false}>
        <p>Ready</p>
      </QueryState>,
    )

    expect(screen.getByLabelText("Loading page")).toBeTruthy()
    expect(screen.queryByText("Ready")).toBeNull()
  })

  it("prefers isError over isLoading", () => {
    render(
      <QueryState isLoading isError>
        <p>Ready</p>
      </QueryState>,
    )

    expect(screen.getByText("Failed to load.")).toBeTruthy()
    expect(screen.queryByLabelText("Loading page")).toBeNull()
  })

  it("uses custom loading, error, and errorMessage overrides", () => {
    const { rerender } = render(
      <QueryState isLoading isError={false} loading={<p>Custom loading</p>}>
        <p>Ready</p>
      </QueryState>,
    )

    expect(screen.getByText("Custom loading")).toBeTruthy()

    rerender(
      <QueryState isLoading={false} isError errorMessage="Could not fetch.">
        <p>Ready</p>
      </QueryState>,
    )

    expect(screen.getByText("Could not fetch.")).toBeTruthy()

    rerender(
      <QueryState isLoading={false} isError error={<p>Custom error</p>}>
        <p>Ready</p>
      </QueryState>,
    )

    expect(screen.getByText("Custom error")).toBeTruthy()
    expect(screen.queryByText("Could not fetch.")).toBeNull()
  })

  it("renders children when the query succeeds", () => {
    render(
      <QueryState isLoading={false} isError={false}>
        <p>Ready</p>
      </QueryState>,
    )

    expect(screen.getByText("Ready")).toBeTruthy()
  })
})
