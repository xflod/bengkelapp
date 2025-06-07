
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Inter } from 'next/font/google';
import Script from 'next/script'; // Import Script

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'BengkelKu App',
  description: 'Point of Sale and Management App for Motorcycle Workshops',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <head>
        {/* Script to apply theme from localStorage before page hydration */}
        <Script id="theme-loader" strategy="beforeInteractive">
          {`
            (function() {
              try {
                const theme = localStorage.getItem('app-theme');
                if (theme === 'native') {
                  document.documentElement.classList.add('theme-native');
                } else {
                  // Default theme doesn't need a specific class, 
                  // or remove 'theme-native' if it was somehow set by mistake
                  document.documentElement.classList.remove('theme-native');
                }
              } catch (e) {
                console.error('Failed to load theme from localStorage', e);
              }
            })();
          `}
        </Script>
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <AppShell>
            {children}
          </AppShell>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
