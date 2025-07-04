export type Contact = {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'lead' | 'customer' | 'archived';
  avatarUrl: string;
  initials: string;
};

export type DealStage = 'Prospecção' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Fechado Ganho' | 'Fechado Perdido';

export const dealStages: DealStage[] = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado Ganho', 'Fechado Perdido'];

export type Opportunity = {
  id: string;
  title: string;
  contactName: string;
  value: number;
  stage: DealStage;
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
};

export type AppUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  permissions: string[];
};

export type Role = {
  id: string;
  name: string;
  permissions: string[];
};
