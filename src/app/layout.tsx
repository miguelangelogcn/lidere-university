import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import DynamicAuthProvider from '@/components/dynamic-auth-provider';
import { EnvCheckWrapper } from '@/components/env-check-wrapper';

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: 'Lidere University',
  description: 'Sua plataforma de gestão para a Lidere University.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('font-body antialiased', fontBody.variable, fontHeadline.variable)}>
        <EnvCheckWrapper>
          <DynamicAuthProvider>
            {children}
            <Toaster />
          </DynamicAuthProvider>
        </EnvCheckWrapper>
      </body>
    </html>
  );
}
