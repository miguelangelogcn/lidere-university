'use client';

import { useState, useEffect } from 'react';
import { getFormationById } from "@/services/formationService";
import { MainHeader } from "@/components/main-header";
import { FormationViewer } from "@/components/formation-viewer";
import { useAuth } from '@/context/auth-provider';
import type { SerializableFormation } from '@/lib/types';
import FormationDetailsLoading from './loading';
import { AlertTriangle } from 'lucide-react';

export default function FormationDetailsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [formation, setFormation] = useState<SerializableFormation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function fetchAndCheckAccess() {
      if (!user) return; // Wait for user data

      setLoading(true);

      const formationData = await getFormationById(params.id);
      setFormation(formationData);

      // Check access: if user has accessibleFormations, they must include this one.
      // If they don't have the field, they are considered an admin/manager and have access.
      const canView = !user.accessibleFormations || user.accessibleFormations.includes(params.id);
      setHasAccess(canView);
      
      setLoading(false);
    }
    fetchAndCheckAccess();
  }, [user, params.id]);

  if (loading) {
    return <FormationDetailsLoading />;
  }

  if (!formation) {
     return (
        <div className="flex flex-col flex-1 items-center justify-center">
            <h2 className="text-2xl font-semibold">Formação não encontrada</h2>
        </div>
     );
  }

  if (!hasAccess) {
    return (
        <>
            <MainHeader title="Acesso Negado" />
            <div className="flex flex-col flex-1 items-center justify-center text-center p-8">
                <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Você não tem permissão para acessar este conteúdo.</h2>
                <p className="text-muted-foreground mt-2">
                    Por favor, entre em contato com o suporte se você acredita que isso é um erro.
                </p>
            </div>
        </>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <MainHeader title="Formação" />
      <FormationViewer formation={formation} />
    </div>
  );
}
