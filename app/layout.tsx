import type { Metadata } from 'next'
import './globals.css'
import './mobile.css'

export const metadata: Metadata = {
  title: 'Vitalis Portal — Staff & Compliance Hub',
  description: 'Vitalis Healthcare Services — Staff Portal for training, compliance, and credentials',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
