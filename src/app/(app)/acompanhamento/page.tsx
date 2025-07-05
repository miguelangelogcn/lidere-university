'use client';

import { useState, useEffect } from 'react';
import { MainHeader } from "@/components/main-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProducts } from '@/services/productService';
import { getFollowUpProcesses } from '@/services/followUpService';
import type { Product, FollowUpProcess } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AcompanhamentoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [followUpProcesses, setFollowUpProcesses] = useState<FollowUpProcess[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [productsData, followUpsData] = await Promise.all([
          getProducts(),
          getFollowUpProcesses(),
        ]);
        setProducts(productsData);
        setFollowUpProcesses(followUpsData);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro!',
          description: 'Falha ao carregar os dados.',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  const filteredFollowUps = selectedProductId
    ? followUpProcesses.filter(p => p.productId === selectedProductId)
    : [];

  const statusLabels: { [key in FollowUpProcess['status']]: string } = {
    todo: 'A Fazer',
    doing: 'Fazendo',
    done: 'Feito',
  };
  
  const statusVariants: { [key in FollowUpProcess['status']]: "default" | "secondary" | "outline" } = {
    todo: 'outline',
    doing: 'default',
    done: 'secondary',
  };


  return (
    <>
      <MainHeader title="Acompanhamento de Clientes" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Filtrar por Produto</CardTitle>
            <CardDescription>
              Selecione um produto para visualizar todos os clientes que estão em acompanhamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedProductId} value={selectedProductId || ''} disabled={loading}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione um produto..."} />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedProductId && (
          <Card>
            <CardHeader>
              <CardTitle>Clientes em Acompanhamento</CardTitle>
              <CardDescription>
                Lista de clientes para o produto selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Cliente</TableHead>
                      <TableHead>Status Geral</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : filteredFollowUps.length > 0 ? (
                      filteredFollowUps.map(process => (
                        <TableRow key={process.id}>
                          <TableCell className="font-medium">{process.contactName}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariants[process.status]}>{statusLabels[process.status]}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">
                          Nenhum cliente em acompanhamento para este produto.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
