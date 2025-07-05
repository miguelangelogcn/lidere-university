import { MainHeader } from "@/components/main-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function FormationDetailsLoading() {
  return (
    <>
      <MainHeader title={<Skeleton className="h-6 w-48" />} />
      {/* New Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b">
        <Skeleton className="h-5 w-1/2" />
        <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-10" />
        </div>
      </div>
      {/* Content Skeleton */}
      <div className="p-6 md:p-8 lg:p-12 mx-auto max-w-4xl space-y-8 w-full">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="aspect-video w-full" />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-4 mt-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </>
  );
}
