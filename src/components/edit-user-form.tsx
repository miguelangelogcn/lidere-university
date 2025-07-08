'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { appModules } from '@/lib/modules';
import type { AppUser, Role } from '@/lib/types';
import { updateUser } from '@/services/userService';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from 'lucide-react';

type EditUserFormProps = {
  user: AppUser;
  onUserUpdated: () => void;
  roles: Role[];
};

type PermissionAssignment = 'role' | 'custom' | 'hybrid';

function getInitialPermissionAssignment(user: AppUser): PermissionAssignment {
    if (user.roleId && (user.permissions || []).length > 0) return 'hybrid';
    if (user.roleId) return 'role';
    return 'custom';
}

function getInitialPermissions(user: AppUser, roles: Role[]): string[] {
    const role = roles.find(r => r.id === user.roleId);
    const rolePermissions = role?.permissions || [];
    const userPermissions = user.permissions || [];
    return [...new Set([...rolePermissions, ...userPermissions])];
}

export function EditUserForm({ user, onUserUpdated, roles }: EditUserFormProps) {
  const [name, setName] = useState(user.name || '');
  const [permissionAssignment, setPermissionAssignment] = useState<PermissionAssignment>(() => getInitialPermissionAssignment(user));
  const [selectedRoleId, setSelectedRoleId] = useState(user.roleId || '');
  const [permissions, setPermissions] = useState<string[]>(() => getInitialPermissions(user, roles));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // This effect ensures that when the selected role changes, the permissions are updated accordingly
    // in 'role' or 'hybrid' mode. It doesn't run on initial mount.
    const role = roles.find(r => r.id === selectedRoleId);
    if (!role && (permissionAssignment === 'role' || permissionAssignment === 'hybrid')) {
        setPermissions([]);
        return;
    }

    if (role && (permissionAssignment === 'role' || permissionAssignment === 'hybrid')) {
        setPermissions(role.permissions || []);
    }
  }, [selectedRoleId, permissionAssignment, roles]);


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
    if ((permissionAssignment === 'role' || permissionAssignment === 'hybrid') && !selectedRoleId) {
        setError('Por favor, selecione um cargo.');
        return;
    }
    setError(null);
    setLoading(true);

    let dataToUpdate: any = { name };
    const role = roles.find(r => r.id === selectedRoleId);

    if (permissionAssignment === 'role') {
        dataToUpdate.roleId = selectedRoleId;
        dataToUpdate.permissions = [];
      } else if (permissionAssignment === 'custom') {
        dataToUpdate.roleId = null;
        dataToUpdate.permissions = permissions;
      } else if (permissionAssignment === 'hybrid') {
        if (!role) {
          setError('Cargo selecionado para modo híbrido é inválido.');
          setLoading(false);
          return;
        }
        dataToUpdate.roleId = selectedRoleId;
        const rolePermissions = new Set(role.permissions || []);
        const customPermissions = permissions.filter(p => !rolePermissions.has(p));
        dataToUpdate.permissions = customPermissions;
      }

    try {
      await updateUser(user.id, dataToUpdate);
      onUserUpdated();
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar usuário.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const areCheckboxesDisabled = permissionAssignment === 'role';

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
      <div className="grid gap-2">
        <Label htmlFor="email-edit">Email</Label>
        <Input id="email-edit" type="email" value={user.email || ''} disabled className="disabled:opacity-100"/>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name-edit">Nome</Label>
        <Input id="name-edit" type="text" placeholder="Nome do usuário" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      
      <div className="grid gap-4 pt-2">
        <Label>Atribuição de Permissões</Label>
        <RadioGroup value={permissionAssignment} onValueChange={(value) => setPermissionAssignment(value as PermissionAssignment)} className="grid grid-cols-3 gap-4">
          <div><Label htmlFor="e-r-custom" className="flex items-center gap-2 cursor-pointer text-sm font-normal"><RadioGroupItem value="custom" id="e-r-custom" /> Personalizado</Label></div>
          <div><Label htmlFor="e-r-role" className="flex items-center gap-2 cursor-pointer text-sm font-normal"><RadioGroupItem value="role" id="e-r-role" /> Por Cargo</Label></div>
          <div><Label htmlFor="e-r-hybrid" className="flex items-center gap-2 cursor-pointer text-sm font-normal"><RadioGroupItem value="hybrid" id="e-r-hybrid" /> Híbrido</Label></div>
        </RadioGroup>
        
        <div className="grid gap-2">
            <Label htmlFor="role-edit">Cargo</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId} disabled={permissionAssignment === 'custom'}>
              <SelectTrigger id="role-edit" className="w-full">
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
        <Accordion type="multiple" className="w-full" defaultValue={appModules.map(m => m.id)}>
            {appModules.map((module) => {
              const allModuleItems = module.items.map((item) => item.href);
              const isAllSelected = allModuleItems.every((href) => permissions.includes(href));
              const isPartiallySelected = allModuleItems.some((href) => permissions.includes(href)) && !isAllSelected;

              const handleModuleSelection = (checked: boolean | 'indeterminate') => {
                  setPermissions((prev) => {
                    const currentPermissions = new Set(prev);
                    if (checked) {
                      allModuleItems.forEach(item => currentPermissions.add(item));
                    } else {
                      allModuleItems.forEach(item => currentPermissions.delete(item));
                    }
                    return Array.from(currentPermissions);
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
                                      id={`edit-${item.href}`}
                                      checked={permissions.includes(item.href)}
                                      onCheckedChange={(checked) => handlePermissionChange(item.href, !!checked)}
                                      disabled={areCheckboxesDisabled}
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
