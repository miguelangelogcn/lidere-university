import { MainHeader } from "@/components/main-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function FormationDetailsLoading() {
  return (
    <>
      <MainHeader title={<Skeleton className="h-6 w-48" />} />
      <main className="grid flex-1 grid-cols-1 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr]">
        {/* Left Column Skeleton */}
        <div className="flex flex-col border-r bg-muted/40 p-4 space-y-4">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        {/* Right Column Skeleton */}
        <div className="flex-1 overflow-y-auto">
            <div className="p-6 md:p-8 space-y-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="aspect-video w-full" />
              <div className="space-y-4 mt-6">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
        </div>
      </main>
    </>
  );
}
