 
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
  Mail,
  Workflow,
  DollarSign,
  Building2,
  Landmark,
  Receipt,
  LayoutDashboard,
  AreaChart,
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
    id: "diretoria",
    name: "Diretoria",
    items: [
     { href: "/dashboard-vendas", icon: AreaChart, label: "Dashboard de Vendas" },
     { href: "/dashboard-operacoes", icon: ClipboardCheck, label: "Dashboard de Operações" },
     { href: "/dashboard-operacoes-2", icon: ClipboardCheck, label: "Dashboard de Operações 2" },
     { href: "/dashboard-conteudos", icon: GraduationCap, label: "Dashboard de Conteúdos" },
    ]
  },
  {
    id: "vendas",
    name: "Vendas",
    items: [
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
    id: "financeiro",
    name: "Financeiro",
    items: [
      { href: "/financeiro", icon: DollarSign, label: "Registros" },
      { href: "/contas", icon: Landmark, label: "Contas" },
      { href: "/dividas", icon: Receipt, label: "Dívidas" },
      { href: "/empresas", icon: Building2, label: "Empresas" },
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
    id: "gestao-avancada",
    name: "Gestão Avançada",
    items: [
      { href: "/users", icon: Users, label: "Gerenciar Usuários" },
      { href: "/gerenciar-alunos", icon: GraduationCap, label: "Gerenciar Alunos" },
      { href: "/roles", icon: Briefcase, label: "Gerenciar Cargos" },
      { href: "/tags", icon: Tag, label: "Gerenciar Tags" },
      { href: "/products", icon: Package, label: "Gerenciar Produtos" },
      { href: "/email-templates", icon: Mail, label: "Gerenciar Emails" },
      { href: "/automacoes", icon: Workflow, label: "Automações" },
    ],
  }
];

    
