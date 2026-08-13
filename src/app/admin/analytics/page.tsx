"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Analytics duplicated Reports' payment-summary/enrollment-summary calls
 * under different date windows (production audit finding) — merged into
 * Reports & Analytics as one nav entry. This route stays only as a
 * redirect so any bookmarked/old link still lands somewhere real.
 */
export default function AnalyticsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/reports');
  }, [router]);
  return null;
}
