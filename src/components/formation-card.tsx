import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { Formation } from '@/lib/types';

type FormationCardProps = {
  formation: Formation;
};

export function FormationCard({ formation }: FormationCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-0">
        <Link href={`/formacoes/${formation.id}`} className="block">
          <Image
            src={formation.thumbnailUrl || 'https://placehold.co/600x400.png'}
            alt={formation.title}
            width={600}
            height={400}
            className="h-48 w-full object-cover"
            data-ai-hint="course thumbnail"
          />
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
