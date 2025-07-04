'use client';

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  Contact,
  Home,
  LineChart,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { AuthGuard } from "@/context/auth-provider";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  const navItems = [
    { href: "/dashboard", icon: Home, label: "Painel de Desempenho" },
    { href: "/pipeline", icon: LineChart, label: "Funil de Vendas" },
    { href: "/contacts", icon: Contact, label: "Contatos" },
    { href: "/smart-email", icon: Sparkles, label: "Email Inteligente", badge: "AI" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold font-headline">
                <Logo className="h-6 w-6 text-primary" />
                <span>Lidere University</span>
              </Link>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.badge && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mt-auto p-4 border-t">
               <Button onClick={handleLogout} variant="ghost" className="w-full justify-start">
                 <LogOut className="h-4 w-4 mr-2" />
                 Sair
               </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
