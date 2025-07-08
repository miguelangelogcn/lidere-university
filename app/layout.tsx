// This file is a duplicate and should not be used.
// The correct file is located at src/app/layout.tsx.
// This is being kept to prevent build errors from misconfiguration.
import type { ReactNode } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Returning children directly or null will break the app if this layout is used,
  // which is intended to force the build system to use the correct layout from src/app.
  return <>{children}</>;
}
