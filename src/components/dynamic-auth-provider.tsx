'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

const AuthProvider = dynamic(
  () => import('@/context/auth-provider').then((mod) => mod.AuthProvider),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Carregando...</p>
      </div>
    ),
  }
);

export default function DynamicAuthProvider({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>
}
