'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { appModules } from '@/lib/modules';
import type { Role } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from 'lucide-react';

type AddUserFormProps = {
  onUserAdded: () => void;
  roles: Role[];
};

type PermissionAssignment = 'role' | 'custom' | 'hybrid';

export function AddUserForm({ onUserAdded, roles }: AddUserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionAssignment, setPermissionAssignment] = useState<PermissionAssignment>('custom');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = roles.find(r => r.id === selectedRoleId);
    if ((permissionAssignment === 'role' || permissionAssignment === 'hybrid') && role) {
      setPermissions(role.permissions || []);
    } else {
      setPermissions([]);
    }
  }, [permissionAssignment, selectedRoleId, roles]);

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
    if ((permissionAssignment === 'role' || permissionAssignment === 'hybrid') && !selectedRoleId) {
        setError('Por favor, selecione um cargo.');
        return;
    }
    setError(null);
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let userData: any = {
        email: user.email,
        name: name,
        avatarUrl: null,
      };

      if (permissionAssignment === 'role') {
        userData.roleId = selectedRoleId;
        userData.permissions = [];
      } else if (permissionAssignment === 'custom') {
        userData.roleId = null;
        userData.permissions = permissions;
      } else if (permissionAssignment === 'hybrid') {
        userData.roleId = selectedRoleId;
        userData.permissions = permissions;
      }

      await setDoc(doc(db, "users", user.uid), userData);
      onUserAdded();
    } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
            setError('Este email já está em uso por outro usuário.');
        } else if (err.code === 'auth/weak-password') {
            setError('A senha deve ter pelo menos 6 caracteres.');
        } else {
            setError('Falha ao criar conta. Verifique os dados e tente novamente.');
        }
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const areCheckboxesDisabled = permissionAssignment === 'role';

  return (
    <form onSubmit={handleSignup} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" type="text" placeholder="Nome completo" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <div className="grid gap-4 pt-2">
        <Label>Atribuição de Permissões</Label>
        <RadioGroup value={permissionAssignment} onValueChange={(value) => setPermissionAssignment(value as PermissionAssignment)} className="grid grid-cols-3 gap-4">
          <div><Label htmlFor="r-custom" className="flex items-center gap-2 cursor-pointer text-sm font-normal"><RadioGroupItem value="custom" id="r-custom" /> Personalizado</Label></div>
          <div><Label htmlFor="r-role" className="flex items-center gap-2 cursor-pointer text-sm font-normal"><RadioGroupItem value="role" id="r-role" /> Por Cargo</Label></div>
          <div><Label htmlFor="r-hybrid" className="flex items-center gap-2 cursor-pointer text-sm font-normal"><RadioGroupItem value="hybrid" id="r-hybrid" /> Híbrido</Label></div>
        </RadioGroup>
        
        <div className="grid gap-2">
            <Label htmlFor="role">Cargo</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId} disabled={permissionAssignment === 'custom'}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>

        <Label>Módulos de Acesso</Label>
        <Accordion type="multiple" className="w-full">
          {appModules.map((module) => {
            const allModuleItems = module.items.map((item) => item.href);
            const isAllSelected = allModuleItems.every((href) => permissions.includes(href));
            const isPartiallySelected = allModuleItems.some((href) => permissions.includes(href)) && !isAllSelected;

            const handleModuleSelection = (checked: boolean | 'indeterminate') => {
                setPermissions((prev) => {
                  if (checked) return [...new Set([...prev, ...allModuleItems])];
                  else return prev.filter((p) => !allModuleItems.includes(p));
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
                      disabled={areCheckboxesDisabled}
                    />
                  </div>
                  <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-2 pr-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 text-sm font-normal">
                    <span>{module.name}</span>
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
                                    disabled={areCheckboxesDisabled}
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
