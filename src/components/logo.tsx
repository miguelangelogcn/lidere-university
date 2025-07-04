import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-8 text-white", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15.5 2.5a.5.5 0 0 1 .5.5v18a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5Z" />
      <path d="m16 3 5.914 5.914a.5.5 0 0 1-.353.854H16V3Z" />
      <path d="M8.5 2.5a.5.5 0 0 0-.5.5v18a.5.5 0 0 0 1 0V3a.5.5 0 0 0-.5-.5Z" />
      <path d="m8 3-5.914 5.914a.5.5 0 0 0 .353.854H8V3Z" />
    </svg>
  );
}
