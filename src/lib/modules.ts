import {
  Briefcase,
  Contact,
  Home,
  LineChart,
  Sparkles,
  Users,
  Tag,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export type ModuleItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
};

export type Module = {
  id: string;
  name: string;
  items: ModuleItem[];
};

export const appModules: Module[] = [
  {
    id: "vendas",
    name: "Vendas",
    items: [
      { href: "/dashboard", icon: Home, label: "Painel de Desempenho" },
      { href: "/pipeline", icon: LineChart, label: "Funil de Vendas" },
      { href: "/contacts", icon: Contact, label: "Contatos" },
      { href: "/smart-email", icon: Sparkles, label: "Email Inteligente", badge: "AI" },
    ],
  },
  {
    id: "operacoes",
    name: "Operações",
    items: [
      { href: "/onboarding", icon: ClipboardCheck, label: "Onboarding" },
    ],
  },
  {
    id: "diretoria",
    name: "Diretoria",
    items: [
      { href: "/users", icon: Users, label: "Gerenciar Usuários" },
      { href: "/roles", icon: Briefcase, label: "Gerenciar Cargos" },
      { href: "/pipelines", icon: LineChart, label: "Gerenciar Funis" },
      { href: "/tags", icon: Tag, label: "Gerenciar Tags" },
    ],
  }
];
