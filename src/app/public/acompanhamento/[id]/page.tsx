'use server';

import { PublicFollowUpView } from "@/components/public-follow-up-view";
import { getFollowUpProcessById } from "@/services/followUpService";
import { notFound } from "next/navigation";
import type { SerializableFollowUpProcess } from "@/lib/types";

type PublicAcompanhamentoPageProps = {
    params: {
        id: string;
    }
}

export default async function PublicAcompanhamentoPage({ params }: PublicAcompanhamentoPageProps) {
    
    const process = await getFollowUpProcessById(params.id);

    if (!process) {
        notFound();
    }

    // Firestore Timestamps are not serializable and cannot be passed from Server to Client Components.
    // We convert them to ISO strings before passing them as props.
    const serializableProcess: SerializableFollowUpProcess = {
        ...process,
        actionPlan: process.actionPlan?.map(item => ({
            ...item,
            dueDate: item.dueDate.toDate().toISOString(),
        })),
        mentorships: process.mentorships?.map(mentorship => ({
            ...mentorship,
            createdAt: mentorship.createdAt.toDate().toISOString(),
        })),
    };

    return (
        <PublicFollowUpView process={serializableProcess} />
    )
}
