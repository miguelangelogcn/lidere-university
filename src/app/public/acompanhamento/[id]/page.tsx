import { getFollowUpProcessById } from "@/services/followUpService";
import { PublicFollowUpView } from "@/components/public-follow-up-view";
import type { SerializableFollowUpProcess } from "@/lib/types";

// Helper to safely convert different date formats to an ISO string
function safeToISOString(dateValue: any): string | null {
    if (!dateValue) {
        return null;
    }
    // Firestore Timestamp
    if (typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toISOString();
    }
    // JS Date or a parsable string
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
        return date.toISOString();
    }
    // Firestore Timestamp from wire format { seconds: ..., nanoseconds: ... }
    if (typeof dateValue === 'object' && typeof dateValue.seconds === 'number') {
      return new Date(dateValue.seconds * 1000).toISOString();
    }
    
    return null;
}


export default async function PublicAcompanhamentoPage({ params }: { params: { id: string } }) {
    const process = await getFollowUpProcessById(params.id);

    if (!process) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Acompanhamento não encontrado.</p>
            </div>
        );
    }
    
    const serializableProcess: SerializableFollowUpProcess = {
        ...process,
        actionPlan: process.actionPlan?.map(item => ({
            ...item,
            dueDate: safeToISOString(item.dueDate),
        })),
        mentorships: process.mentorships?.map(mentorship => ({
            ...mentorship,
            createdAt: safeToISOString(mentorship.createdAt),
        })),
    };


    return <PublicFollowUpView process={serializableProcess} />;
}
