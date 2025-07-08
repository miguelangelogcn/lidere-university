






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
  studentAccess?: { userId: string } | null;
  formationAccess?: FormationAccess[];
  formationProgress?: { [formationId: string]: string[] }; // {[formationId]: [lessonId, ...]}
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

export type FormationAccess = {
  formationId: string;
  expiresAt: string | null; // ISO string on client
};

export type AppUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  permissions: string[];
  roleId?: string | null;
  contactId?: string | null;
  formationAccess?: FormationAccess[];
  formationProgress?: { [formationId: string]: string[] };
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
  formationIds: string[];
  contentAccessDays: number | null;
  hasFollowUp: boolean;
  followUpDays: number | null;
};

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
  followUpEndDate?: any; // Firestore Timestamp
};

export type Company = {
    id: string;
    name: string;
    initialCash?: number;
};

export type FinancialRecord = {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: any; // Firestore Timestamp
    category?: string;
    companyId: string;
    companyName?: string;
    createdAt: any; // Firestore Timestamp
};

export type Account = {
    id: string;
    description: string;
    amount: number;
    dueDate: any; // Firestore Timestamp
    companyId: string;
    companyName?: string;
    status: 'pending' | 'paid';
    isRecurring: boolean;
    recurrence?: {
        frequency: 'weekly' | 'monthly' | 'quarterly' | 'semiannually' | 'yearly';
        endDate?: any | null; // Firestore Timestamp
    };
    notes?: string;
    paidAt?: any | null; // Firestore Timestamp
    createdAt: any; // Firestore Timestamp
}

export type Debt = {
    id: string;
    description: string;
    creditor: string;
    originalAmount: number;
    interestRate: number; // percentage
    companyId: string;
    companyName?: string;
    status: 'aberta' | 'negociada' | 'paga';
    negotiationDetails?: {
        numberOfInstallments: number;
        installmentAmount: number;
        firstInstallmentDate: any; // Firestore Timestamp
        linkedAccountIds: string[];
    } | null;
    createdAt: any;
};

export type SerializableDebt = Omit<Debt, 'createdAt' | 'negotiationDetails'> & {
    createdAt: string;
    negotiationDetails?: {
        numberOfInstallments: number;
        installmentAmount: number;
        firstInstallmentDate: string;
        linkedAccountIds: string[];
    } | null;
};

export type SerializableAccount = Omit<Account, 'dueDate' | 'createdAt' | 'paidAt' | 'recurrence'> & {
    dueDate: string;
    createdAt: string;
    paidAt?: string | null;
    recurrence?: {
        frequency: 'weekly' | 'monthly' | 'quarterly' | 'semiannually' | 'yearly';
        endDate?: string | null;
    };
};

export type SerializableFinancialRecord = Omit<FinancialRecord, 'date' | 'createdAt'> & {
    date: string;
    createdAt: string;
};


// Types for passing data from Server to Client Components
export type SerializableMentorship = Omit<Mentorship, 'createdAt'> & { createdAt: string | null };
export type SerializableActionItem = Omit<ActionItem, 'dueDate' | 'submittedAt' | 'validatedAt'> & {
    dueDate: string | null;
    submittedAt: string | null;
    validatedAt: string | null;
};

export type SerializableFollowUpProcess = Omit<FollowUpProcess, 'mentorships' | 'actionPlan' | 'followUpEndDate'> & {
  mentorships?: SerializableMentorship[];
  actionPlan?: SerializableActionItem[];
  followUpEndDate?: string | null;
};

export type Comment = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  text: string;
  createdAt: any; // Firestore Timestamp
};

export type SerializableComment = Omit<Comment, 'createdAt'> & {
    createdAt: string;
};

export type Lesson = {
  id: string;
  title: string;
  videoUrl?: string | null;
  textContent?: string | null;
  attachments?: { name: string; url: string }[];
  comments?: Comment[];
  order: number;
};

export type SerializableLesson = Omit<Lesson, 'comments'> & {
    comments?: SerializableComment[];
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
  order: number;
};

export type SerializableModule = Omit<Module, 'lessons'> & {
    lessons: SerializableLesson[];
};


export type Formation = {
  id:string;
  title: string;
  description: string;
  modules: Module[];
};

export type SerializableFormation = Omit<Formation, 'modules'> & {
    modules: SerializableModule[];
};

export type EmailTemplate = {
    id: string;
    slug: string; // e.g., 'welcome-email', unique identifier
    name: string;
    subject: string;
    body: string; // HTML body with placeholders like {{name}}
};

export type WebhookLog = {
    id: string;
    payload: any;
    headers: any;
    result: {
        success: boolean;
        message: string;
        [key: string]: any;
    };
    createdAt: any; // Firestore Timestamp
}

export type SerializableWebhookLog = Omit<WebhookLog, 'createdAt'> & {
    createdAt: string;
}
