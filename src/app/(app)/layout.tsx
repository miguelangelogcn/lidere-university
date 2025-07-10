
'use client';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar"
import { appModules } from "@/lib/modules";
import { useAuth, AuthGuard } from "@/context/auth-provider";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Logo } from "@/components/logo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();

    const isModuleAccessible = (moduleItems: any[]) => {
        if (!user?.permissions) return false;
        return moduleItems.some(item => isItemVisible(item));
    };

    const isItemVisible = (item: any) => {
        if (!user?.permissions) return false;
        // This logic handles the case where the route was changed but the permission wasn't.
        // It allows the user to see the new route if they have permission for the old one.
        if (item.href === '/relatorio-financeiro') {
            return user.permissions.includes('/relatorio-financeiro') || user.permissions.includes('/dashboard-financeiro');
        }
        return user.permissions.includes(item.href);
    }

    return (
        <AuthGuard>
            <SidebarProvider>
                <Sidebar>
                    <SidebarHeader className="p-4">
                       <Logo className="h-10 w-auto" />
                    </SidebarHeader>
                    <SidebarContent>
                        {appModules.map(module => (
                            isModuleAccessible(module.items) && (
                                <SidebarMenu key={module.id}>
                                    <SidebarMenuItem>
                                        <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground">{module.name}</h3>
                                    </SidebarMenuItem>
                                    {module.items.map(item => (
                                         isItemVisible(item) && (
                                            <SidebarMenuItem key={item.href}>
                                                <Link href={item.href}>
                                                    <SidebarMenuButton isActive={pathname === item.href}>
                                                        <item.icon />
                                                        <span>{item.label}</span>
                                                    </SidebarMenuButton>
                                                </Link>
                                            </SidebarMenuItem>
                                        )
                                    ))}
                                </SidebarMenu>
                            )
                        ))}
                    </SidebarContent>
                </Sidebar>
                <SidebarInset>
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    )
}
