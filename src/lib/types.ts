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

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  day: number; // 0-7
  order: number;
};

export type Onboarding = {
  id: string; // Same as product ID
  productId: string;
  productName: string;
  steps: OnboardingStep[];
};

export type OnboardingProcess = {
  id: string;
  contactId: string;
  contactName: string;
  productId: string;
  productName: string;
  status: 'todo' | 'doing' | 'done';
  onboardingProgress: Record<string, boolean>; // { [stepId]: checked }
};

export type Mentorship = {
  id: string;
  transcription: string;
  summary: string;
  documents: { name: string; url: string }[];
  recordingUrl?: string | null;
  createdAt: any; // Firestore Timestamp
};

export type ActionItemStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export type ActionItem = {
    id: string;
    title: string;
    description: string;
    dueDate: any; // Firestore Timestamp
    status: ActionItemStatus;
    validationText?: string;
    validationAttachments?: { name: string; url: string }[];
    submittedAt?: any; // Firestore Timestamp
    rejectionReason?: string;
    validatedAt?: any; // Firestore Timestamp
};

export type FollowUpProcess = {
  id: string;
  contactId: string;
  contactName: string;
  productId: string;
  productName: string;
  status: 'todo' | 'doing' | 'done';
  mentorships?: Mentorship[];
  actionPlan?: ActionItem[];
};

// Types for passing data from Server to Client Components
export type SerializableMentorship = Omit<Mentorship, 'createdAt'> & { createdAt: string | null };
export type SerializableActionItem = Omit<ActionItem, 'dueDate' | 'submittedAt' | 'validatedAt'> & {
    dueDate: string | null;
    submittedAt: string | null;
    validatedAt: string | null;
};

export type SerializableFollowUpProcess = Omit<FollowUpProcess, 'mentorships' | 'actionPlan'> & {
  mentorships?: SerializableMentorship[];
  actionPlan?: SerializableActionItem[];
};

export type Lesson = {
  id: string;
  title: string;
  videoUrl?: string | null;
  textContent?: string | null;
  attachments?: { name: string; url: string }[];
  order: number;
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
  order: number;
};

export type Formation = {
  id:string;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  modules: Module[];
};
