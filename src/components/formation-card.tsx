import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, GraduationCap } from 'lucide-react';
import type { Formation } from '@/lib/types';

type FormationCardProps = {
  formation: Formation;
};

export function FormationCard({ formation }: FormationCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-0">
        <Link href={`/formacoes/${formation.id}`} className="block">
          <div className="flex h-48 w-full items-center justify-center bg-muted">
            <GraduationCap className="h-16 w-16 text-muted-foreground" />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="text-lg font-bold">
          <Link href={`/formacoes/${formation.id}`}>{formation.title}</Link>
        </CardTitle>
        <CardDescription className="mt-2 line-clamp-3 text-sm">
          {formation.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/formacoes/${formation.id}`}>
            Acessar Curso
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
