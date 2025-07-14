
'use client';

import { AuthGuard, useAuth } from '@/context/auth-provider';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarTrigger, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { appModules } from '@/lib/modules';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import React from 'react';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };
    
    const userPermissions = new Set(user?.permissions || []);

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <Logo className="h-10 w-auto" />
                </SidebarHeader>
                <SidebarContent>
                    {appModules.map((module) => {
                        const accessibleItems = module.items.filter(item => userPermissions.has(item.href));
                        if (accessibleItems.length === 0) return null;

                        return (
                             <SidebarGroup key={module.id}>
                                <SidebarGroupLabel>{module.name}</SidebarGroupLabel>
                                <SidebarMenu>
                                    {accessibleItems.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <Link href={item.href} passHref legacyBehavior>
                                                <SidebarMenuButton asChild isActive={pathname === item.href}>
                                                    <a>
                                                        <item.icon />
                                                        <span>{item.label}</span>
                                                         {item.badge && <span className="ml-auto text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{item.badge}</span>}
                                                    </a>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroup>
                        )
                    })}
                </SidebarContent>
                <SidebarFooter>
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                        <LogOut className="mr-2" /> Sair
                    </Button>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <AppLayoutContent>{children}</AppLayoutContent>
        </AuthGuard>
    );
}
