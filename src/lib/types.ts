export type Contact = {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  email?: string | null;
  city?: string | null;
  maritalStatus?: string | null;
  age?: number | null;
  gender?: string | null;
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

export type Tag = {
  id: string;
  name:string;
  description?: string;
}

export type Product = {
  id: string;
  name: string;
  price: number;
  deliverables: string[];
  presentationUrl?: string | null;
  warranty: string;
}