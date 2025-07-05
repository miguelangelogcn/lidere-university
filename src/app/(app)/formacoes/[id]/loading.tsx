import { MainHeader } from "@/components/main-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function FormationDetailsLoading() {
  return (
    <>
      <MainHeader title={<Skeleton className="h-6 w-48" />} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <Skeleton className="mb-2 h-10 w-3/4" />
            <Skeleton className="mb-8 h-6 w-1/2" />
            
            <Skeleton className="mb-4 h-8 w-1/3" />
            
            <div className="w-full space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
