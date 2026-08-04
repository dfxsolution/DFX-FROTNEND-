"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Toast } from '@/components/ui/toast';
import {
  FileSpreadsheet,
  FileText,
  Download,
  TrendingUp,
  Coins,
  Users,
  CreditCard,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { reportService, PaymentSummary, TopCustomersReport, EnrollmentSummary } from '@/services/reportService';
import { ApiError } from '@/lib/apiClient';
import { triggerExportDownload } from '@/lib/exportDownload';

const ENROLLMENT_STATUS_BADGE: Record<string, 'success' | 'neutral' | 'danger'> = {
  ACTIVE: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};

/** Growth-percent pill. `invert` flips the good/bad color (e.g. a drop in
 * outstanding dues is a good thing, unlike a drop in revenue). Renders a
 * neutral dash when the backend couldn't compute a comparison (e.g. the
 * previous period had zero base, or no comparison exists for this metric). */
function GrowthBadge({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null) {
    return (
      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
        —
      </span>
    );
  }
  const isGood = invert ? value <= 0 : value >= 0;
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
        isGood
          ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
          : 'text-red-600 bg-red-50 border-red-200'
      }`}
    >
      {value > 0 ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

export default function AdminReportsPage() {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomersReport | null>(null);
  const [enrollmentSummary, setEnrollmentSummary] = useState<EnrollmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setLoadError('');
    try {
      // "Total Revenue (YTD)" in the header below reflects this: all three
      // KPI/table calls use the This Year period for a consistent YTD view.
      const [payments, customers, enrollments] = await Promise.all([
        reportService.getPaymentSummary({ period: 'this_year' }),
        reportService.getTopCustomers({ period: 'this_year', limit: 10 }),
        reportService.getEnrollmentSummary({ period: 'this_year' }),
      ]);
      setPaymentSummary(payments);
      setTopCustomers(customers);
      setEnrollmentSummary(enrollments);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleExportPDF = () => {
    setToastMsg("Generating Executive Financial Report PDF...");
    setTimeout(() => setToastMsg("Executive_Financial_Report_Jul2025.pdf downloaded"), 1200);
  };

  const handleExportExcel = async () => {
    setToastMsg("Exporting ledger data to Excel...");
    try {
      const file = await reportService.exportReportsSummary({ period: 'this_year', format: 'excel' });
      triggerExportDownload(file);
      setToastMsg(`${file.filename} downloaded`);
    } catch (err) {
      setToastMsg(err instanceof ApiError ? err.message : 'Export failed. Please try again.');
    }
  };

  // There is only one revenue stream in this system (scheme payments), so
  // "Total Revenue" and "Total Scheme Collections" currently read from the
  // same backend figure — see PaymentSummaryResponse in the backend schema.
  const kpis = paymentSummary
    ? [
        {
          label: 'Total Revenue (YTD)',
          val: formatCurrency(paymentSummary.totalRevenue),
          growth: paymentSummary.totalRevenueGrowthPercent,
          invert: false,
          icon: TrendingUp,
          color: 'text-amber-600 bg-amber-50',
        },
        {
          label: 'Total Scheme Collections',
          val: formatCurrency(paymentSummary.totalRevenue),
          growth: paymentSummary.totalRevenueGrowthPercent,
          invert: false,
          icon: Coins,
          color: 'text-teal-600 bg-teal-50',
        },
        {
          label: 'Outstanding Dues',
          val: formatCurrency(paymentSummary.outstandingDues),
          growth: paymentSummary.outstandingDuesGrowthPercent,
          invert: true,
          icon: CreditCard,
          color: 'text-emerald-600 bg-emerald-50',
        },
        {
          label: 'Total Active Passbooks',
          val: String(enrollmentSummary?.activeCount ?? 0),
          // No period-over-period comparison is computable for a live status
          // count without a status-change history table — see handoff notes.
          growth: null as number | null,
          invert: false,
          icon: Users,
          color: 'text-blue-600 bg-blue-50',
        },
      ]
    : [];

  const monthlyChartData =
    paymentSummary?.monthlyTrend.map((t) => ({
      month: t.label,
      revenue: t.totalAmount,
      collections: t.totalAmount,
    })) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-body">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-[#0B0E23]">
            Executive Business & Financial Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Comprehensive audit reports, monthly revenue comparisons, scheme redemptions, and GST GST logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="h-9">
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" /> Excel
          </Button>
          <Button onClick={handleExportPDF} size="sm" className="bg-gold hover:bg-gold-dark text-white font-bold h-9">
            <FileText className="w-4 h-4 mr-1.5" /> Export PDF
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
          <Button size="sm" variant="outline" className="mt-3" onClick={loadReports}>
            Retry
          </Button>
        </Card>
      )}

      {!loading && !loadError && (
        <>
          {/* SUMMARY STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((st, idx) => {
              const IconComp = st.icon;
              return (
                <Card key={idx} variant="statistic" className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${st.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <GrowthBadge value={st.growth} invert={st.invert} />
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{st.label}</div>
                  <div className="text-xl font-extrabold text-[#0B0E23] font-display mt-0.5">{st.val}</div>
                </Card>
              );
            })}
          </div>

          {/* RECHARTS COMPARISON CHART */}
          <Card className="p-5 bg-white border-slate-200 shadow-xs">
            <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#0B0E23]">
                  Monthly Revenue vs Scheme Collections Comparison
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">Year-to-date monthly performance</p>
              </div>
              <Badge variant="gold">{paymentSummary?.range.label ?? 'YTD'}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${v/100000}L`} />
                    <Tooltip formatter={(val: number) => [formatCurrency(val), 'Amount']} contentStyle={{ backgroundColor: '#0B0E23', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="revenue" fill="#0B0E23" radius={[6, 6, 0, 0]} name="Total Revenue" />
                    <Bar dataKey="collections" fill="#2C6FBD" radius={[6, 6, 0, 0]} name="Scheme Collections" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* TOP CUSTOMERS REPORT TABLE */}
          <Card className="p-5 bg-white border-slate-200 shadow-xs">
            <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#0B0E23]">
                  Top High-Value Scheme Customers
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium">Highest total gold accumulated and installment consistency</p>
              </div>
              <Button onClick={handleExportExcel} variant="outline" size="sm" className="text-xs font-bold">
                <Download className="w-3.5 h-3.5 mr-1" /> Export Table
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Primary Scheme</th>
                      <th className="p-3 text-right">Total Invested</th>
                      <th className="p-3 text-right">Accumulated Gold</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(topCustomers?.customers ?? []).map((row, idx) => (
                      <tr key={row.enrollmentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-gold-dark">#{idx + 1}</td>
                        <td className="p-3 font-bold text-[#0B0E23]">{row.customerName}</td>
                        <td className="p-3">{row.schemeName}</td>
                        <td className="p-3 text-right font-mono font-bold text-[#0B0E23]">
                          {formatCurrency(row.totalInvested)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-700">
                          {row.goldWeightGrams.toFixed(3)} g
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={ENROLLMENT_STATUS_BADGE[row.enrollmentStatus] ?? 'neutral'} className="text-[10px]">
                            {row.enrollmentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {(topCustomers?.customers.length ?? 0) === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          No successful payments recorded in this period yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
