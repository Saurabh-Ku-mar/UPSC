import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from 'next/font/google'

import './globals.css'

const geist = Geist({ subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })

const hindiFont = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'UPSC Jet',
  description: 'UPSC Preparation Platform',
  generator: 'upsc-jet',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="hi-IN">
      <body
        className={`${geist.className} ${hindiFont.className} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}