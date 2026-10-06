import { cn } from "@/lib/utils.ts";

/**
 * Base Skeleton — a shimmer placeholder block.
 * All other skeleton variants are built from this.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-muted/70 rounded-none", className)}
      {...props}
    />
  );
}

// ── Product card skeleton ──────────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="group">
      {/* Image */}
      <Skeleton className="w-full mb-4" style={{ aspectRatio: "3/4" }} />
      {/* Title */}
      <Skeleton className="h-5 w-3/4 mb-2" />
      {/* Price */}
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

// ── Product grid skeleton (4-up) ───────────────────────────────────────────────

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Product detail skeleton ────────────────────────────────────────────────────

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-8">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-32" />
      </div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        {/* Image gallery */}
        <div className="flex gap-4">
          <div className="hidden md:flex flex-col gap-3 w-20 shrink-0">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="w-20 h-24" />
            ))}
          </div>
          <Skeleton className="flex-1" style={{ aspectRatio: "3/4" }} />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24" /> {/* brand */}
          <Skeleton className="h-10 w-4/5" /> {/* title */}
          <Skeleton className="h-7 w-32" /> {/* price */}
          {/* Sizes */}
          <div className="flex gap-2 mt-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-12 h-12" />
            ))}
          </div>
          {/* CTA */}
          <Skeleton className="h-14 w-full mt-4" />
          <Skeleton className="h-12 w-full" />
          {/* Accordion */}
          <div className="border-t border-border pt-4 space-y-4 mt-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Admin table row skeleton ───────────────────────────────────────────────────

export function AdminTableSkeleton({
  rows = 6,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="bg-card border border-border divide-y divide-border">
      {/* Header */}
      <div
        className="px-5 py-3 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="px-5 py-4 grid gap-4 items-center"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-14 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <Skeleton key={c} className="h-4 w-3/4" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── KPI card skeleton ──────────────────────────────────────────────────────────

export function KpiCardSkeleton() {
  return (
    <div className="bg-card border border-border p-5 space-y-3">
      <Skeleton className="w-9 h-9" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Order card skeleton ────────────────────────────────────────────────────────

export function OrderCardSkeleton() {
  return (
    <div className="border border-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="w-14 h-16" />
        ))}
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

// ── Full-page skeleton screen (RequireAuth loading) ────────────────────────────

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-[65px] bg-background/95 border-b border-border flex items-center justify-between px-6 z-50">
        <Skeleton className="h-7 w-16" />
        <div className="hidden md:flex gap-8">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
        <div className="flex gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-4 w-4 rounded-full" />
          ))}
        </div>
      </div>
      {/* Body */}
      <div className="pt-[65px] max-w-7xl mx-auto px-6 py-16 space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-14 w-64" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
