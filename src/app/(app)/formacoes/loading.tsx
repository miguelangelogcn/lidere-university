import { MainHeader } from "@/components/main-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function FormacoesLoading() {
  return (
    <>
      <MainHeader title="Formações" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="space-y-2 p-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <Skeleton className="h-10 w-full m-2" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
