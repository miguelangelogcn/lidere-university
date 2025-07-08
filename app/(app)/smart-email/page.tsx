import { MainHeader } from "@/components/main-header";
import { SmartEmailForm } from "@/components/smart-email-form";

export default function SmartEmailPage() {
    return (
        <>
            <MainHeader title="Email Inteligente" />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <SmartEmailForm />
            </main>
        </>
    )
}
