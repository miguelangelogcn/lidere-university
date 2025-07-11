
'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function DashboardFinanceiroRedirectPage() {
  useEffect(() => {
    redirect('/dashboard-financeiro');
  }, []);

  return null;
}
