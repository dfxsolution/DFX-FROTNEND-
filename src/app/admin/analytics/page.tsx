"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Toast } from '@/components/ui/toast';
import {
  TrendingUp,
  Users,
  Sparkles,
  Zap,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { reportService, PaymentSummary, EnrollmentSummary } from '@/services/reportService';
import { ApiError } from '@/lib/apiClient';
import { triggerExportDownload } from '@/lib/exportDownload';

// No branch is linked to a Payment or Enrollment anywhere in the current
// schema, so per-branch attribution can't be computed. Left empty rather
// than fabricated — see SESSION_HANDOFF.md Module 12.
const STORE_PERFORMANCE_DATA: { store: string; sales: number; members: number }[] = [];

export default function AdminAnalyticsPage() {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [enrollmentSummary, setEnrollmentSummary] = useState<EnrollmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleExport = async () => {
    setToastMsg('Exporting analytics summary to Excel...');
    try {
      const file = await reportService.exportAnalyticsSummary('excel');
      triggerExportDownload(file);
      setToastMsg(`${file.filename} downloaded`);
    } catch (err) {
      setToastMsg(err instanceof ApiError ? err.message : 'Export failed. Please try again.');
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [payments, enrollments] = await Promise.all([
        // "Avg Installment Size ... Per Monthly Payment" — monthly window.
        reportService.getPaymentSummary({ period: 'this_month' }),
        // Serves both the retention KPI and the weekly trend chart below.
        reportService.getEnrollmentSummary({ period: 'this_week' }),
      ]);
      setPaymentSummary(payments);
      setEnrollmentSummary(enrollments);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const kpis = [
    {
      label: 'Conversion Funnel',
      val: enrollmentSummary?.conversionFunnelPercent != null ? `${enrollmentSummary.conversionFunnelPercent}%` : '—',
      desc: enrollmentSummary?.conversionFunnelPercent != null ? 'Leads to Scheme Enrolment' : 'No lead-tracking data yet',
      icon: Zap,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Scheme Retention',
      val: enrollmentSummary?.retentionRatePercent != null ? `${enrollmentSummary.retentionRatePercent}%` : '—',
      desc: 'Active + Completed vs Cancelled',
      icon: Sparkles,
      color: 'text-teal-600 bg-teal-50',
    },
    {
      label: 'Avg Installment Size',
      val: paymentSummary ? formatCurrency(paymentSummary.avgInstallmentAmount) : '—',
      desc: 'Per Successful Payment (This Month)',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Redemption Velocity',
      val: enrollmentSummary?.redemptionVelocityDays != null ? `${enrollmentSummary.redemptionVelocityDays} Days` : '—',
      desc: enrollmentSummary?.redemptionVelocityDays != null ? 'Avg Time to Purchase' : 'No redemption-tracking data yet',
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
    },
  ];

  // newLeads/redemptions have no backing data source (see kpis above) — kept
  // as chart series with null values so the existing multi-line chart still
  // renders without a redesign, they just draw nothing.
  const trendChartData =
    enrollmentSummary?.dailyTrend.map((t) => ({
      day: t.label,
      newLeads: null as number | null,
      enrolments: t.newEnrollments,
      redemptions: null as number | null,
    })) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">
            Customer & Scheme Analytics Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Customer conversion funnel, gold redemption rate velocity, and multi-store performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="gold">Live Data</Badge>
          <Button onClick={handleExport} variant="outline" size="sm" className="h-9">
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!loading && loadError && (
        <Card className="p-4 border-red-200 bg-red-50/60">
          <p className="text-xs font-medium text-red-700">{loadError}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={loadAnalytics}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !loadError && (
        <>
          {/* EXECUTIVE KPI METRICS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((st, idx) => {
              const IconComp = st.icon;
              return (
                <Card key={idx} variant="statistic" className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${st.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{st.label}</div>
                  <div className="text-xl font-extrabold text-[#0B0E23] font-display mt-0.5">{st.val}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">{st.desc}</div>
                </Card>
              );
            })}
          </div>

          {/* MULTI-LINE CONVERSION FUNNEL CHART */}
          <Card className="p-5 bg-white border-slate-200 shadow-xs">
            <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#0B0E23]">
                  Weekly Customer Acquisition & Scheme Conversion
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Daily scheme enrolments this week. Walk-in/inquiry and redemption lines are not shown — no lead or redemption tracking exists yet.
                </p>
              </div>
              <Badge variant="gold">{enrollmentSummary?.range.label ?? 'Weekly Trend'}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0E23', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="newLeads" stroke="#3B82F6" strokeWidth={3} name="Store Walk-ins / Inquiries" connectNulls={false} />
                    <Line type="monotone" dataKey="enrolments" stroke="#2C6FBD" strokeWidth={3} name="Scheme Enrolments" />
                    <Line type="monotone" dataKey="redemptions" stroke="#10B981" strokeWidth={3} name="Jewellery Redemptions" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* STORE BRANCH COMPARISON BAR CHART */}
          <Card className="p-5 bg-white border-slate-200 shadow-xs">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base font-bold text-[#0B0E23]">
                Branch Revenue & Member Comparison
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium">
                Not available yet — payments and enrollments aren&apos;t linked to a specific branch in the current data model.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={STORE_PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="store" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${v/100000}L`} />
                    <Tooltip formatter={(val: number) => [formatCurrency(val), 'Sales']} contentStyle={{ backgroundColor: '#0B0E23', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="sales" fill="#2C6FBD" radius={[6, 6, 0, 0]} name="Daily Sales Volume" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </div>
  );
}
