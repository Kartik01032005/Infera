"use client";

import React, { useEffect, useState } from "react";

interface TransactionItem {
  id: string;
  amount: string | number;
  currency: string;
  country?: string;
  transaction_type: string;
  status: string;
  created_at: string;
}

interface RiskItem {
  id: string;
  risk_level: string;
  risk_score?: string | number | null;
  reason?: string | null;
  created_at: string;
}

interface LoginItem {
  id: string;
  ip_address?: string | null;
  status: string;
  failure_reason?: string | null;
  created_at: string;
}

interface ComplianceItem {
  id: string;
  event_type: string;
  status: string;
  created_at: string;
}

interface DashboardData {
  company_id: string;
  company_name: string;
  transactions: {
    total_count: number;
    total_amount: string | number;
    completed_count: number;
    failed_count: number;
    flagged_count: number;
    recent_transactions: TransactionItem[];
  };
  risk: {
    total_events: number;
    high_risk_count: number;
    critical_risk_count: number;
    avg_risk_score?: string | number | null;
    recent_events: RiskItem[];
  };
  security: {
    total_logins: number;
    failed_logins: number;
    blocked_logins: number;
    successful_logins: number;
    recent_events: LoginItem[];
  };
  compliance: {
    total_events: number;
    open_events: number;
    resolved_events: number;
    escalated_events: number;
    recent_events: ComplianceItem[];
  };
  finance: {
    total_revenue: string | number;
    currency: string;
    avg_transaction_value: string | number;
  };
}

const DEMO_USERS = [
  {
    label: "Company A — Apex Global Technologies (CEO)",
    email: "apex.ceo@example.com",
    company: "Apex Global",
  },
  {
    label: "Company B — Lumina Financial Solutions (CEO)",
    email: "lumina.ceo@example.com",
    company: "Lumina Solutions",
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ExecutiveDashboard() {
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTenantChange = (index: number) => {
    setSelectedUserIndex(index);
    setLoading(true);
    setError(null);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      try {
        const email = DEMO_USERS[selectedUserIndex].email;
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email,
            password: "InferaDevPassword2026!",
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || "Failed to authenticate session");
        }

        const json = await res.json();
        const accessToken = json.data.access_token;
        if (ignore) return;

        const dashRes = await fetch(`${API_BASE}/dashboard`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });

        if (!dashRes.ok) {
          const errData = await dashRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Error ${dashRes.status}: Failed to load dashboard`);
        }

        const dashJson = await dashRes.json();
        if (ignore) return;
        setDashboard(dashJson.data);
      } catch (err: unknown) {
        if (ignore) return;
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to sign in to tenant workspace.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [selectedUserIndex, refreshKey]);


  const formatCurrency = (val: string | number | undefined, currency = "USD") => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              IN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Infera</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  Executive Dashboard
                </span>
              </div>
              <p className="text-xs text-zinc-400">Multi-Tenant Intelligence & Virtual CIO</p>
            </div>
          </div>

          {/* Tenant Session Selector */}
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl">
            <span className="text-xs font-medium text-zinc-400 pl-2">Tenant Scope:</span>
            <div className="flex gap-1">
              {DEMO_USERS.map((user, idx) => (
                <button
                  key={user.email}
                  onClick={() => handleTenantChange(idx)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedUserIndex === idx
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  {user.company}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Loading State */}
        {loading && !dashboard && (
          <div className="space-y-6">
            <div className="h-10 w-64 bg-zinc-900 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-zinc-900 rounded-2xl border border-zinc-800/60 animate-pulse" />
              ))}
            </div>
            <div className="h-80 bg-zinc-900 rounded-2xl border border-zinc-800/60 animate-pulse" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-rose-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Failed to load executive dashboard
            </div>
            <p className="text-sm text-rose-300/80">{error}</p>
            <button
              onClick={handleRetry}
              className="text-xs px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded-lg border border-rose-700 transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && dashboard && (
          <>
            {/* Company Banner & Isolation Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-zinc-800/60 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{dashboard.company_name}</h2>
                <p className="text-sm text-zinc-400">
                  Tenant-Isolated PostgreSQL Analytics • Real-time database metrics
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Isolated Company ID:</span>
                <code className="text-zinc-300 font-mono">{dashboard.company_id}</code>
              </div>
            </div>

            {/* 1. Executive Overview KPI Grid */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                Executive Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue Card */}
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-zinc-400 font-medium">Total Revenue</span>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Completed
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-white tracking-tight">
                    {formatCurrency(dashboard.finance.total_revenue, dashboard.finance.currency)}
                  </div>
                  <div className="mt-2 text-xs text-zinc-400">
                    Avg Transaction: {formatCurrency(dashboard.finance.avg_transaction_value)}
                  </div>
                </div>

                {/* Transactions Card */}
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-zinc-400 font-medium">Transactions</span>
                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {dashboard.transactions.completed_count} done
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-white tracking-tight">
                    {dashboard.transactions.total_count}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-amber-400">{dashboard.transactions.flagged_count} flagged</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-rose-400">{dashboard.transactions.failed_count} failed</span>
                  </div>
                </div>

                {/* Risk Events Card */}
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-zinc-400 font-medium">Risk Score & Events</span>
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Score: {dashboard.risk.avg_risk_score ?? "N/A"}
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-white tracking-tight">
                    {dashboard.risk.total_events} <span className="text-sm font-normal text-zinc-400">events</span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-400">
                    <span className="text-rose-400 font-medium">{dashboard.risk.critical_risk_count} critical</span>,{" "}
                    <span className="text-amber-300 font-medium">{dashboard.risk.high_risk_count} high</span>
                  </div>
                </div>

                {/* Security & Compliance Card */}
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-zinc-400 font-medium">Security & Compliance</span>
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {dashboard.compliance.open_events} Open
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-white tracking-tight">
                    {dashboard.security.total_logins} <span className="text-sm font-normal text-zinc-400">logins</span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-400">
                    Failed: <span className="text-rose-400">{dashboard.security.failed_logins}</span> | Escalated:{" "}
                    <span className="text-amber-400">{dashboard.compliance.escalated_events}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Visual Charts & Breakdowns */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transaction Distribution Chart */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">Transaction Pipeline</h4>
                    <p className="text-xs text-zinc-400">Breakdown of all company transactions by status</p>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {dashboard.transactions.total_count} Total
                  </span>
                </div>

                {/* Visual Distribution Bar */}
                <div className="space-y-2">
                  <div className="h-4 rounded-full bg-zinc-800 overflow-hidden flex">
                    <div
                      style={{
                        width: `${
                          dashboard.transactions.total_count
                            ? (dashboard.transactions.completed_count / dashboard.transactions.total_count) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Completed: ${dashboard.transactions.completed_count}`}
                    />
                    <div
                      style={{
                        width: `${
                          dashboard.transactions.total_count
                            ? (dashboard.transactions.flagged_count / dashboard.transactions.total_count) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-amber-500 transition-all duration-500"
                      title={`Flagged: ${dashboard.transactions.flagged_count}`}
                    />
                    <div
                      style={{
                        width: `${
                          dashboard.transactions.total_count
                            ? (dashboard.transactions.failed_count / dashboard.transactions.total_count) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-rose-500 transition-all duration-500"
                      title={`Failed: ${dashboard.transactions.failed_count}`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-zinc-300">Completed ({dashboard.transactions.completed_count})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-zinc-300">Flagged ({dashboard.transactions.flagged_count})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-zinc-300">Failed ({dashboard.transactions.failed_count})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk & Security Posture */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">Security & Risk Posture</h4>
                    <p className="text-xs text-zinc-400">Authentication health and threat concentration</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    Live Telemetry
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                    <div className="text-xs text-zinc-400">Login Success Rate</div>
                    <div className="text-2xl font-bold text-emerald-400">
                      {dashboard.security.total_logins > 0
                        ? `${Math.round(
                            (dashboard.security.successful_logins / dashboard.security.total_logins) * 100
                          )}%`
                        : "100%"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {dashboard.security.successful_logins} of {dashboard.security.total_logins} logins
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                    <div className="text-xs text-zinc-400">Critical Threat Index</div>
                    <div className="text-2xl font-bold text-rose-400">
                      {dashboard.risk.critical_risk_count + dashboard.risk.high_risk_count}
                    </div>
                    <div className="text-xs text-zinc-500">High & Critical Risk Events</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Detailed Operational Tables */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions Table */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">Recent Transactions</h4>
                  <span className="text-xs text-zinc-400">Latest 5 records</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800">
                        <th className="pb-2 font-medium">Type</th>
                        <th className="pb-2 font-medium">Amount</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {dashboard.transactions.recent_transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-800/30">
                          <td className="py-2.5 text-zinc-300 font-medium">
                            {tx.transaction_type}
                            {tx.country && <span className="ml-1 text-zinc-500">({tx.country})</span>}
                          </td>
                          <td className="py-2.5 font-mono text-zinc-100">
                            {formatCurrency(tx.amount, tx.currency)}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                tx.status === "COMPLETED"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : tx.status === "FLAGGED"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-zinc-400">{formatDate(tx.created_at)}</td>
                        </tr>
                      ))}
                      {dashboard.transactions.recent_transactions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-zinc-500">
                            No transactions recorded for this company.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Risk & Security Events */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">Risk & Security Stream</h4>
                  <span className="text-xs text-zinc-400">Audit telemetry</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800">
                        <th className="pb-2 font-medium">Event</th>
                        <th className="pb-2 font-medium">Severity / Status</th>
                        <th className="pb-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {dashboard.risk.recent_events.slice(0, 3).map((r) => (
                        <tr key={r.id} className="hover:bg-zinc-800/30">
                          <td className="py-2.5 text-zinc-300 truncate max-w-[180px]">
                            {r.reason || "Flagged activity trigger"}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                r.risk_level === "CRITICAL"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : r.risk_level === "HIGH"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {r.risk_level} {r.risk_score ? `(${r.risk_score})` : ""}
                            </span>
                          </td>
                          <td className="py-2.5 text-zinc-400">{formatDate(r.created_at)}</td>
                        </tr>
                      ))}
                      {dashboard.security.recent_events.slice(0, 2).map((s) => (
                        <tr key={s.id} className="hover:bg-zinc-800/30">
                          <td className="py-2.5 text-zinc-300">
                            Login from <span className="font-mono">{s.ip_address || "remote"}</span>
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                s.status === "SUCCESS"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-zinc-400">{formatDate(s.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 4. AI Insights Section */}
            <section className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-800/30 space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                <h4 className="font-semibold text-white">Infera AI Intelligence Brief</h4>
              </div>
              <p className="text-sm text-zinc-300 max-w-3xl">
                Ready for executive analysis on <span className="text-white font-medium">{dashboard.company_name}</span>.
                Ask questions such as{" "}
                <em className="text-indigo-300">
                  &ldquo;Why did flagged transactions increase this month?&rdquo;
                </em>{" "}
                to generate dynamic SQL analysis and actionable CIO recommendations.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
