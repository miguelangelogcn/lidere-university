import type { Metadata } from 'next'

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
      <body>
        {children}
      </body>
    </html>
  )
}
