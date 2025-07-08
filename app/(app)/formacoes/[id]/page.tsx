'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getFormationById } from "@/services/formationService";
import { MainHeader } from "@/components/main-header";
import { FormationViewer } from "@/components/formation-viewer";
import { useAuth } from '@/context/auth-provider';
import type { SerializableFormation } from '@/lib/types';
import FormationDetailsLoading from './loading';
import { AlertTriangle } from 'lucide-react';

export default function FormationDetailsPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [formation, setFormation] = useState<SerializableFormation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function fetchAndCheckAccess() {
      if (!user || !params?.id) return; // Wait for user and params

      setLoading(true);

      const formationData = await getFormationById(params.id);
      setFormation(formationData);

      // Check access: user is admin if formationAccess is not defined. Otherwise, check array.
      const hasSpecificAccess = user.formationAccess?.some(access =>
        access.formationId === params.id &&
        (!access.expiresAt || new Date(access.expiresAt) > new Date())
      );
      const canView = !user.formationAccess || hasSpecificAccess;
      setHasAccess(canView);
      
      setLoading(false);
    }
    fetchAndCheckAccess();
  }, [user, params?.id]);

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
