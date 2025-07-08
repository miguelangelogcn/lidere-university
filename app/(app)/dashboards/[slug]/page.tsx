'use client';
import { MainHeader } from "@/components/main-header";
import { Wrench } from "lucide-react";
import { useParams } from 'next/navigation';

export default function DashboardDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || 'Dashboard';
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <>
      <MainHeader title={`Dashboard: ${title}`} />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="text-center">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">Dashboard em Construção</h2>
            <p className="mt-2 text-muted-foreground">
                Os relatórios para a área de {title} estarão disponíveis em breve.
            </p>
        </div>
      </main>
    </>
  );
}
