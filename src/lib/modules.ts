import {
  Briefcase,
  Contact,
  Home,
  LineChart,
  Sparkles,
  Users,
  Tag,
  ClipboardCheck,
  Package,
  ClipboardList,
  GraduationCap,
  Wrench,
  type LucideIcon,
  FileEdit,
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
    id: "geral",
    name: "Geral",
    items: [
      { href: "/inicio", icon: Home, label: "Início" },
    ],
  },
  {
    id: "vendas",
    name: "Vendas",
    items: [
      { href: "/analytics", icon: LineChart, label: "Painel de Desempenho" },
      { href: "/pipeline", icon: Briefcase, label: "Funil de Vendas" },
      { href: "/contacts", icon: Contact, label: "Contatos" },
      { href: "/smart-email", icon: Sparkles, label: "Email Inteligente", badge: "AI" },
    ],
  },
  {
    id: "operacoes",
    name: "Operações",
    items: [
      { href: "/onboarding", icon: ClipboardCheck, label: "Onboarding" },
      { href: "/acompanhamento", icon: ClipboardList, label: "Acompanhamento" },
    ],
  },
  {
    id: "conteudos",
    name: "Conteúdos",
    items: [
      { href: "/formacoes", icon: GraduationCap, label: "Formações" },
      { href: "/ferramentas", icon: Wrench, label: "Ferramentas" },
    ]
  },
  {
    id: "gerenciar-conteudos",
    name: "Gerenciar Conteúdos",
    items: [
        { href: "/gerenciar-formacoes", icon: FileEdit, label: "Formações" },
    ]
  },
  {
    id: "diretoria",
    name: "Diretoria",
    items: [
      { href: "/users", icon: Users, label: "Gerenciar Usuários" },
      { href: "/gerenciar-alunos", icon: GraduationCap, label: "Gerenciar Alunos" },
      { href: "/roles", icon: Briefcase, label: "Gerenciar Cargos" },
      { href: "/tags", icon: Tag, label: "Gerenciar Tags" },
      { href: "/products", icon: Package, label: "Gerenciar Produtos" },
    ],
  }
];
