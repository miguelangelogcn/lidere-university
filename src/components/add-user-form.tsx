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

type AddUserFormProps = {
  onUserAdded: () => void;
};

export function AddUserForm({ onUserAdded }: AddUserFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<string[]>(appModules.map(m => m.id));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePermissionChange = (moduleId: string, checked: boolean) => {
    setPermissions(prev => {
      if (checked) {
        return [...prev, moduleId];
      } else {
        return prev.filter(id => id !== moduleId);
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
          <div className="grid gap-2">
              {appModules.map((module) => (
                  <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox
                          id={module.id}
                          checked={permissions.includes(module.id)}
                          onCheckedChange={(checked) => {
                              handlePermissionChange(module.id, !!checked);
                          }}
                      />
                      <Label htmlFor={module.id} className="font-normal cursor-pointer">
                          {module.name}
                      </Label>
                  </div>
              ))}
          </div>
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Conta'}
      </Button>
    </form>
  );
}
