'use client';

import Analytics from '../components/analytics';
import useFetch from '@/hooks/useFetch';

export default function AnalyticsPage() {
  const { data, error } = useFetch('/api', 'guestUsers');
  return <Analytics data={data} error={error} />;
}