'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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

type AddUserFormProps = {
  onUserAdded: () => void;
};

export function AddUserForm({ onUserAdded }: AddUserFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePermissionChange = (href: string, checked: boolean) => {
    setPermissions(prev => {
      if (checked) {
        return [...prev, href];
      } else {
        return prev.filter(p => p !== href);
      }
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: user.email?.split('@')[0] || 'Novo Usuário',
        avatarUrl: null,
        permissions: permissions,
      });

      onUserAdded();
    } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
            setError('Este email já está em uso.');
        } else if (err.code === 'auth/weak-password') {
            setError('A senha deve ter pelo menos 6 caracteres.');
        } else {
            setError('Falha ao criar conta. Tente novamente.');
        }
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
       <div className="grid gap-4">
          <Label>Módulos de Acesso</Label>
          <Accordion type="multiple" className="w-full">
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
                        id={`module-${module.id}`}
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
                                      id={item.href}
                                      checked={permissions.includes(item.href)}
                                      onCheckedChange={(checked) => handlePermissionChange(item.href, !!checked)}
                                  />
                                  <Label htmlFor={item.href} className="font-normal cursor-pointer">
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
        {loading ? 'Criando...' : 'Criar Conta'}
      </Button>
    </form>
  );
}
