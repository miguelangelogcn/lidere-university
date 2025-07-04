export type Contact = {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'lead' | 'customer' | 'archived';
  avatarUrl?: string | null;
};

export type PipelineStage = {
    id: string;
    name: string;
    order: number;
}

export type Pipeline = {
    id: string;
    name: string;
    stages: PipelineStage[];
}

export type Opportunity = {
  id: string;
  title: string;
  contactName: string;
  value: number;
  pipelineId: string;
  stageId: string;
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
  roleId?: string | null;
};

export type Role = {
  id: string;
  name: string;
  permissions: string[];
};
