'use server';

import { getFollowUpProcessById } from "@/services/followUpService";
import { PublicFollowUpView } from "@/components/public-follow-up-view";
import { notFound } from "next/navigation";
import type { SerializableFollowUpProcess } from "@/lib/types";

type PublicAcompanhamentoPageProps = {
    params: {
        id: string;
    };
};

export default async function PublicAcompanhamentoPage({ params }: PublicAcompanhamentoPageProps) {
    const process = await getFollowUpProcessById(params.id);

    if (!process) {
        notFound();
    }

    const serializableMentorships = process.mentorships?.map(mentorship => ({
        ...mentorship,
        createdAt: mentorship.createdAt?.toDate().toISOString() || null,
    })) || [];
    
    const serializableActionPlan = process.actionPlan?.map(item => ({
        ...item,
        dueDate: item.dueDate?.toDate().toISOString() || null,
        submittedAt: item.submittedAt?.toDate().toISOString() || null,
    })) || [];

    const serializableProcess: SerializableFollowUpProcess = {
        ...process,
        mentorships: serializableMentorships,
        actionPlan: serializableActionPlan,
    };

    return <PublicFollowUpView process={serializableProcess} />;
}