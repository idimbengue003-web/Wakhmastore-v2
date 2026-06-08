import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: 'Wakhma Store — Les bonnes affaires à Dakar',
    template: '%s | Wakhma Store',
  },
  description: 'Poste ce que tu veux. Les vendeurs te le trouvent rapidement. Le marketplace #1 de Dakar, Sénégal. Téléphones, électroménager, immobilier et plus.',
  keywords: ['marketplace', 'Dakar', 'Sénégal', 'annonces', 'vente', 'achat', 'téléphones', 'électroménager'],
  authors: [{ name: 'Wakhma Store' }],
  openGraph: {
    type: 'website',
    locale: 'fr_SN',
    url: 'https://wakhmastore-v2.vercel.app',
    siteName: 'Wakhma Store',
    title: 'Wakhma Store — Les bonnes affaires à Dakar',
    description: 'Poste ce que tu veux. Les vendeurs te le trouvent rapidement. Le marketplace #1 de Dakar, Sénégal.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wakhma Store — Les bonnes affaires à Dakar',
    description: 'Le marketplace #1 de Dakar, Sénégal.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="min-h-screen flex flex-col bg-white text-gray-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
