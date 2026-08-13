"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Production audit finding: this page was a ComingSoonPlaceholder with no
 * backing backend model/endpoint at all — no appointments table exists.
 * Removed from nav; kept as a redirect so any bookmarked/old link lands
 * somewhere real instead of a dead "coming soon" screen.
 */
export default function AppointmentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin');
  }, [router]);
  return null;
}
