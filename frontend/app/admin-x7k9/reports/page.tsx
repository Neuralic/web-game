"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import { usersApi, storage } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  targetType: string | null;
  targetId: string | null;
  targetUrl: string | null;
  category: string;
  description: string | null;
  status: string;
  createdAt: string;
  reporter_username: string | null;
  reporter_display_name: string | null;
}

const STATUS_FILTERS = ["all", "pending", "reviewed", "dismissed"];

export default function AdminReportsPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const checkAccess = async () => {
      const token = storage.getAccessToken();
      if (!token) {
        router.replace("/home");
        return;
      }

      try {
        const response = await usersApi.getCurrentUser();
        const currentUser = response.success ? (response.data?.user as any) : null;
        if (!currentUser?.is_admin) {
          router.replace("/home");
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace("/home");
        return;
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [router]);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    setApiError(null);
    try {
      const token = storage.getAccessToken();
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`${API_BASE}/reports/admin?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setReports(data.data.reports || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        setApiError(data.message || "Failed to load reports");
      }
    } catch (err: any) {
      setApiError(`Network error: ${err.message}`);
    } finally {
      setLoadingReports(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (authorized) fetchReports();
  }, [authorized, fetchReports]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleAction = async (reportId: string, status: "reviewed" | "dismissed") => {
    setActioningId(reportId);
    try {
      const token = storage.getAccessToken();
      const response = await fetch(`${API_BASE}/reports/${reportId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchReports();
      } else {
        setApiError(data.message || `Failed to mark report as ${status}`);
      }
    } catch (err: any) {
      setApiError(`Network error: ${err.message}`);
    } finally {
      setActioningId(null);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Report Reviews</h1>
                <p className="text-gray-500 text-xs">Review reports submitted by users across groups, posts, and other content</p>
              </div>
            </div>
            <button
              onClick={fetchReports}
              className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <Loader2 className={`w-4 h-4 ${loadingReports ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 mb-6">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* API Error Banner */}
          {apiError && (
            <div className="mb-6 flex items-start gap-3 bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-5 py-4 text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Reports list */}
          {loadingReports ? (
            <div className="flex items-center justify-center py-24 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading…
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl py-24 text-center text-gray-600">
              No reports to review
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row gap-5"
                >
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full text-xs font-medium">
                        {report.targetType || "unknown"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          report.status === "pending"
                            ? "bg-yellow-900/40 text-yellow-400"
                            : report.status === "reviewed"
                            ? "bg-green-900/40 text-green-400"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {report.status}
                      </span>
                      <span className="font-semibold text-white">{report.category}</span>
                    </div>

                    {report.description && (
                      <p className="mt-2 text-sm text-gray-300 break-words">{report.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>
                        Reported by{" "}
                        <span className="text-gray-200 font-medium">
                          {report.reporter_display_name || report.reporter_username || "Unknown"}
                        </span>
                      </span>
                      {report.targetId && (
                        <span>
                          Target ID: <span className="text-gray-200 font-medium">{report.targetId}</span>
                        </span>
                      )}
                      {report.targetUrl && (
                        <a
                          href={report.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          View target
                        </a>
                      )}
                      {report.createdAt && (
                        <span>
                          Submitted {new Date(report.createdAt).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 flex-shrink-0 justify-end">
                    <button
                      onClick={() => handleAction(report.id, "reviewed")}
                      disabled={actioningId === report.id || report.status === "reviewed"}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actioningId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "dismissed")}
                      disabled={actioningId === report.id || report.status === "dismissed"}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actioningId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loadingReports && reports.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
