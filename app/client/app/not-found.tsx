'use client';

import { Card, CardContent, CardTitle } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-96">
        <CardContent className="pt-6 text-center">
          <CardTitle className="mb-2">404</CardTitle>
          <p className="text-muted-foreground">The page cannot be found</p>
        </CardContent>
      </Card>
    </div>
  );
}