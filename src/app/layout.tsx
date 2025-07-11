
import type { Metadata } from 'next'
import { Inter, Lexend } from 'next/font/google'
import "./globals.css"
import { Toaster } from '@/components/ui/toaster'
import DynamicAuthProvider from '@/components/dynamic-auth-provider'
import { EnvCheckWrapper } from '@/components/env-check-wrapper'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const lexend = Lexend({ subsets: ['latin'], variable: '--font-headline'})

export const metadata: Metadata = {
  title: 'Lidere University',
  description: 'Plataforma para gestão de mentorias e cursos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${lexend.variable}`}>
        {/* <EnvCheckWrapper> -> Removido temporariamente */}
          <DynamicAuthProvider>
            {children}
            <Toaster />
          </DynamicAuthProvider>
        {/* </EnvCheckWrapper> -> Removido temporariamente */}
      </body>
    </html>
  )
}
