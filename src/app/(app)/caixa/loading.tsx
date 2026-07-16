import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingCaixa() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g} className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
