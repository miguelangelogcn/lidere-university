import { getFormationById } from "@/services/formationService";
import { MainHeader } from "@/components/main-header";
import { notFound } from "next/navigation";
import { FormationViewer } from "@/components/formation-viewer";

export default async function FormationDetailsPage({ params }: { params: { id: string } }) {
  const formation = await getFormationById(params.id);

  if (!formation) {
    notFound();
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <MainHeader title="Formação" />
      <FormationViewer formation={formation} />
    </div>
  );
}
