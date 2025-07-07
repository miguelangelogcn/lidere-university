import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src="https://placehold.co/100x100.png"
        alt="Lidere University Logo"
        fill
        className="object-contain"
        data-ai-hint="logo"
      />
    </div>
  );
}
