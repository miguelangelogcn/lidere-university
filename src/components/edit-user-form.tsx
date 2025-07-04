'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { appModules } from '@/lib/modules';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from 'lucide-react';
import type { AppUser } from '@/lib/types';
import { updateUser } from '@/services/userService';

type EditUserFormProps = {
  user: AppUser;
  onUserUpdated: () => void;
};

export function EditUserForm({ user, onUserUpdated }: EditUserFormProps) {
  const [name, setName] = useState(user.name || '');
  const [permissions, setPermissions] = useState<string[]>(user.permissions || []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user.name || '');
    setPermissions(user.permissions || []);
  }, [user]);

  const handlePermissionChange = (href: string, checked: boolean) => {
    setPermissions(prev => {
      if (checked) {
        return [...prev, href];
      } else {
        return prev.filter(p => p !== href);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateUser(user.id, {
        name,
        permissions,
      });
      onUserUpdated();
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar usuário.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="email-edit">Email</Label>
        <Input
          id="email-edit"
          type="email"
          value={user.email || ''}
          disabled
          className="disabled:opacity-100"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name-edit">Nome</Label>
        <Input
          id="name-edit"
          type="text"
          placeholder="Nome do usuário"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
       <div className="grid gap-4">
          <Label>Módulos de Acesso</Label>
          <Accordion type="multiple" className="w-full" defaultValue={appModules.map(m => m.id)}>
            {appModules.map((module) => {
              const allModuleItems = module.items.map((item) => item.href);
              const isAllSelected = allModuleItems.every((href) => permissions.includes(href));
              const isPartiallySelected = allModuleItems.some((href) => permissions.includes(href)) && !isAllSelected;

              const handleModuleSelection = (checked: boolean | 'indeterminate') => {
                  setPermissions((prev) => {
                    if (checked) {
                      return [...new Set([...prev, ...allModuleItems])];
                    } else {
                      return prev.filter((p) => !allModuleItems.includes(p));
                    }
                  });
              };

              return (
                <AccordionItem value={module.id} key={module.id}>
                  <AccordionPrimitive.Header className="flex w-full items-center">
                    <div className="pl-3 pr-2 py-2">
                      <Checkbox
                        id={`edit-module-${module.id}`}
                        checked={isAllSelected ? true : isPartiallySelected ? 'indeterminate' : false}
                        onCheckedChange={handleModuleSelection}
                      />
                    </div>
                    <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-2 pr-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180">
                      <span className="text-sm font-normal">
                        {module.name}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionContent>
                      <div className="grid gap-3 pl-12 pt-2">
                          {module.items.map((item) => (
                              <div key={item.href} className="flex items-center space-x-3">
                                  <Checkbox
                                      id={`edit-${item.href}`}
                                      checked={permissions.includes(item.href)}
                                      onCheckedChange={(checked) => handlePermissionChange(item.href, !!checked)}
                                  />
                                  <Label htmlFor={`edit-${item.href}`} className="font-normal cursor-pointer">
                                      {item.label}
                                  </Label>
                              </div>
                          ))}
                      </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </form>
  );
}
