import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Swiftleads AI</title>
        <meta name="description" content="AI-powered lead generation and calling" />
      </head>
      <body className={inter.className}>
        <div className="app-container">
          {children}
        </div>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}