import { MainHeader } from "@/components/main-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function FormacoesLoading() {
  return (
    <>
      <MainHeader title="Formações" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-lg border bg-card shadow-sm">
              <Skeleton className="h-48 w-full" />
              <div className="flex-grow p-4 space-y-2">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <div className="p-4 pt-0">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
