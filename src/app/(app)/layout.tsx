'use client';

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthGuard, useAuth } from "@/context/auth-provider";
import { appModules } from "@/lib/modules";
import { 
    SidebarProvider, 
    Sidebar, 
    SidebarHeader, 
    SidebarContent, 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton, 
    SidebarGroup, 
    SidebarGroupLabel, 
    SidebarFooter, 
    SidebarInset,
    useSidebar
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

function SidebarNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const visibleModules = appModules
    .map(module => ({
        ...module,
        items: module.items.filter(item => user?.permissions?.includes(item.href))
    }))
    .filter(module => module.items.length > 0);

  return (
    <div className="flex flex-col h-full">
        <SidebarHeader>
            <Link href="/inicio" className="flex items-center gap-2 font-semibold font-headline">
                <Logo className="h-6 w-6 text-primary" />
                <span className="group-data-[collapsible=icon]:hidden">Vendas Ágeis</span>
            </Link>
        </SidebarHeader>
        <SidebarContent>
            {visibleModules.map((module) => (
                <SidebarGroup key={module.name}>
                    <SidebarGroupLabel>{module.name}</SidebarGroupLabel>
                    <SidebarMenu>
                        {module.items.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton 
                                  asChild 
                                  tooltip={item.label} 
                                  isActive={pathname === item.href}
                                  onClick={() => setOpenMobile(false)}
                                >
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                        {item.badge && (
                                            <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground group-data-[collapsible=icon]:hidden">
                                              {item.badge}
                                            </Badge>
                                        )}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} tooltip="Sair">
                        <LogOut />
                        <span>Sair</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    </div>
  )
}


export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <AuthGuard>
            <SidebarProvider>
                <Sidebar collapsible="icon">
                    <SidebarNav />
                </Sidebar>
                <SidebarInset>
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    );
}
