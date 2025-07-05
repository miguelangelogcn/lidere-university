'use client';

import { useState, useEffect } from "react";
import { getFormations } from "@/services/formationService";
import { MainHeader } from "@/components/main-header";
import { FormationCard } from "@/components/formation-card";
import { useAuth } from "@/context/auth-provider";
import type { SerializableFormation } from "@/lib/types";
import FormacoesLoading from "./loading";

export default function FormacoesPage() {
  const { user } = useAuth();
  const [formations, setFormations] = useState<SerializableFormation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFormations() {
      setLoading(true);
      const allFormations = await getFormations();
      
      // If user has specific formations, filter them. Otherwise, show all.
      if (user?.accessibleFormations) {
        const accessible = allFormations.filter(f => user.accessibleFormations!.includes(f.id));
        setFormations(accessible);
      } else {
        setFormations(allFormations);
      }
      
      setLoading(false);
    }

    if (user) {
        fetchFormations();
    }
  }, [user]);

  if (loading) {
    return <FormacoesLoading />;
  }
  
  return (
    <>
      <MainHeader title="Formações" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {formations.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {formations.map((formation) => (
              <FormationCard key={formation.id} formation={formation} />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-12">
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">Nenhuma formação encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Parece que não há cursos disponíveis para você no momento.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
