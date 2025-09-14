'use client';

import Link from 'next/link';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Updated Navbar component to match page style
function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left spacer */}
          <div className="flex-1"></div>
          
          {/* Centered title */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Salesforce Logs
            </h1>
          </div>
          
          {/* Right side - Analytics button */}
          <div className="flex-1 flex justify-end">
            <Button asChild variant="default">
              <Link href="/analytics">
                Analytics
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Query Provider wrapper
function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: 3,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <Providers>
          <div className="App">
            <Navbar />
            <div className="content">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}