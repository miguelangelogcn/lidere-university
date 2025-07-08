import { MainHeader } from "@/components/main-header";
import { Wrench } from "lucide-react";

export default function FerramentasPage() {
  return (
    <>
      <MainHeader title="Ferramentas" />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="text-center">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">Página de Ferramentas</h2>
            <p className="mt-2 text-muted-foreground">
                Esta área está em construção.
                <br/>
                Em breve, você encontrará aqui todas as ferramentas úteis.
            </p>
        </div>
      </main>
    </>
  );
}
