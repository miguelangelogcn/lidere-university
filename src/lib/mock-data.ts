import type { Contact, Opportunity, Notification, DealStage } from './types';

export const mockContacts: Contact[] = [
  { id: '1', name: 'Ana Silva', email: 'ana.silva@example.com', company: 'Inovatech', phone: '(11) 98765-4321', status: 'customer', avatarUrl: 'https://placehold.co/40x40.png', initials: 'AS' },
  { id: '2', name: 'Bruno Costa', email: 'bruno.costa@example.com', company: 'Soluções XYZ', phone: '(21) 91234-5678', status: 'lead', avatarUrl: 'https://placehold.co/40x40.png', initials: 'BC' },
  { id: '3', name: 'Carla Dias', email: 'carla.dias@example.com', company: 'TechGlobal', phone: '(31) 99988-7766', status: 'lead', avatarUrl: 'https://placehold.co/40x40.png', initials: 'CD' },
  { id: '4', name: 'Daniel Alves', email: 'daniel.alves@example.com', company: 'Mercado Top', phone: '(41) 98877-6655', status: 'customer', avatarUrl: 'https://placehold.co/40x40.png', initials: 'DA' },
  { id: '5', name: 'Eduarda Lima', email: 'eduarda.lima@example.com', company: 'BuildFast', phone: '(51) 97766-5544', status: 'archived', avatarUrl: 'https://placehold.co/40x40.png', initials: 'EL' },
];

export const mockOpportunities: Opportunity[] = [
    { id: 'o1', title: 'Desenvolvimento de Novo Website', contactName: 'Ana Silva', value: 25000, stage: 'Proposta' },
    { id: 'o2', title: 'Contrato de Suporte de TI', contactName: 'Bruno Costa', value: 12000, stage: 'Qualificação' },
    { id: 'o3', title: 'Implementação de Sistema ERP', contactName: 'Carla Dias', value: 80000, stage: 'Prospecção' },
    { id: 'o4', title: 'Renovação de Licenças de Software', contactName: 'Daniel Alves', value: 5000, stage: 'Fechado Ganho' },
    { id: 'o5', title: 'Consultoria de Marketing Digital', contactName: 'Ana Silva', value: 18000, stage: 'Negociação' },
    { id: 'o6', title: 'Treinamento de Equipe de Vendas', contactName: 'Carla Dias', value: 9500, stage: 'Qualificação' },
    { id: 'o7', title: 'Auditoria de Segurança', contactName: 'Bruno Costa', value: 22000, stage: 'Fechado Perdido' },
];

export const mockNotifications: Notification[] = [
    { id: 'n1', title: 'Novo lead atribuído', description: 'Bruno Costa da Soluções XYZ', timestamp: '5m atrás' },
    { id: 'n2', title: 'Follow-up importante', description: 'Ligar para Ana Silva sobre a proposta', timestamp: '2h atrás' },
    { id: 'n3', title: 'Negócio fechado!', description: 'Parabéns por fechar com Mercado Top', timestamp: '1d atrás' },
];
