import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Praecox — Business Automation Ecosystem',
  description: 'Praecox membangun sistem cerdas yang mengotomatiskan alur kerja, mengintegrasikan alat bisnis, dan meningkatkan efisiensi operasional.',
  keywords: ['business automation', 'sistem bisnis', 'otomasi', 'praecox'],
  openGraph: {
    title: 'Praecox',
    description: 'Business Automation Ecosystem',
    siteName: 'Praecox',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${font.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
