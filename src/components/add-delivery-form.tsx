'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createOnboardingProcess } from '@/services/deliveryService';
import { getContacts } from '@/services/contactService';
import { getProducts } from '@/services/productService';
import type { Contact, Product } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const onboardingSchema = z.object({
  contactId: z.string().min(1, 'Selecione um contato.'),
  productId: z.string().min(1, 'Selecione um produto.'),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

type AddOnboardingFormProps = {
  onSuccess: () => void;
};

export function AddDeliveryForm({ onSuccess }: AddOnboardingFormProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [contactList, productList] = await Promise.all([
          getContacts(),
          getProducts(),
        ]);
        setContacts(contactList);
        setProducts(productList);
      } catch (error) {
        toast({ variant: "destructive", title: "Erro!", description: "Falha ao carregar dados para o formulário." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (data: OnboardingFormValues) => {
    try {
      const selectedContact = contacts.find(c => c.id === data.contactId);
      const selectedProduct = products.find(p => p.id === data.productId);

      if (!selectedContact || !selectedProduct) {
        throw new Error("Contato ou produto inválido selecionado.");
      }

      await createOnboardingProcess({
        contactId: selectedContact.id,
        contactName: selectedContact.name,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
      });
      toast({ title: "Sucesso!", description: "Onboarding criado com sucesso." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro!", description: err.message || 'Falha ao criar onboarding.' });
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
        <FormField
          control={form.control}
          name="contactId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contato</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o contato que comprou" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto vendido" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Criando...' : 'Criar Onboarding'}
        </Button>
      </form>
    </Form>
  );
}
