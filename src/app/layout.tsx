import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppProvider } from '@/components/layout/AppProvider'

export const metadata: Metadata = {
  title: 'Flow',
  description: 'A calmer way to move through your day.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: '#0e0e10',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
