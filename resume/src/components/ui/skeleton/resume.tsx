import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard({ count }: { count: number }) {
  return (
    <div className="flex flex-col space-y-3">
      {[...Array(count)].map((_, index) => (
        <Skeleton key={index} className="h-[125px] w-[250px] rounded-xl" />
      ))}
      <div className="space-y-2">
        {[...Array(count)].map((_, index) => (
          <Skeleton key={index} className="h-4 w-[250px]" />
        ))}
        {[...Array(count)].map((_, index) => (
          <Skeleton key={index} className="h-4 w-[200px]" />
        ))}
      </div>
    </div>
  )
}