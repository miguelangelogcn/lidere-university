'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { testWebhook } from '@/lib/actions/automationActions';
import { getProducts } from '@/services/productService';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const testSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Email inválido.'),
  phone: z.string().min(1, 'O telefone é obrigatório.'),
  productName: z.string().min(1, 'Selecione um produto.'),
});

type TestFormValues = z.infer<typeof testSchema>;

export function WebhookTestForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const productList = await getProducts();
        setProducts(productList);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os produtos.' });
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [toast]);

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: { name: 'Aluno Teste', email: `teste-${Date.now()}@example.com`, phone: '11987654321' }
  });

  const onSubmit = async (data: TestFormValues) => {
    setIsSubmitting(true);
    setApiResponse(null);
    try {
      const result = await testWebhook(data);
      setApiResponse(JSON.stringify(result, null, 2));

      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Falha no Teste', description: result.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      setApiResponse(JSON.stringify({ success: false, message: errorMessage }, null, 2));
      toast({ variant: 'destructive', title: 'Erro Crítico', description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Testar Webhook de Compra</CardTitle>
              <CardDescription>Simule uma nova venda enviando dados para a sua API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="productName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto Comprado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingProducts}>
                    <FormControl><SelectTrigger><SelectValue placeholder={loadingProducts ? "Carregando..." : "Selecione um produto"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Executar Teste
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resposta da API</CardTitle>
          <CardDescription>O resultado do teste aparecerá aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="mt-2 w-full overflow-x-auto rounded-md bg-muted p-4 text-sm">
            <code className="text-foreground">
              {apiResponse || 'Aguardando execução do teste...'}
            </code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
