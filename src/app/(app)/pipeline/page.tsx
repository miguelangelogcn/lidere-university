import { MainHeader } from "@/components/main-header";

export default function PipelinePage() {
  return (
    <>
      <MainHeader title="Funil de Vendas" />
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Nenhum funil selecionado</h2>
            <p className="text-muted-foreground">
                Para visualizar os negócios, primeiro selecione um funil de vendas.
                <br/>
                Você pode criar e gerenciar funis em "Gerenciar Funis".
            </p>
        </div>
      </main>
    </>
  );
}
