/** Skeleton that mirrors `BlogCardBase` default variant. */
export default function LoadingCard() {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-soft"
      aria-hidden="true"
    >
      <div className="h-48 animate-pulse bg-neutral-100 sm:h-56 md:h-64" />
      <div className="space-y-3 p-4 sm:p-5 md:p-6">
        <div className="h-5 w-28 animate-pulse rounded-md bg-neutral-100" />
        <div className="h-6 w-4/5 animate-pulse rounded-md bg-neutral-100" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded-md bg-neutral-100" />
          <div className="h-4 w-11/12 animate-pulse rounded-md bg-neutral-100" />
          <div className="h-4 w-2/3 animate-pulse rounded-md bg-neutral-100" />
        </div>
        <div className="h-4 w-24 animate-pulse rounded-md bg-neutral-100" />
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-neutral-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-16 animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-10 w-20 animate-pulse rounded-lg bg-neutral-100" />
          </div>
        </div>
      </div>
    </article>
  );
}
