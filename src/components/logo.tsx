import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src="https://firebasestorage.googleapis.com/v0/b/lidere-university.firebasestorage.app/o/ICON.png?alt=media&token=a1cc61f0-446c-4ddf-bd01-9a88cbb61416"
        alt="Lidere University Logo"
        fill
        className="object-contain"
        data-ai-hint="logo"
      />
    </div>
  );
}
