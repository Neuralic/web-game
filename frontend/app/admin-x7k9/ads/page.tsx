"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, ShieldAlert, ImageOff } from "lucide-react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import { usersApi, storage } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface AdminAd {
  id: string;
  userId: string;
  name: string;
  format: string;
  imageUrl: string;
  bidPerDay: number;
  groupId: string | null;
  status: string;
  impressions: number;
  clicks: number;
  spent: number;
  createdAt: string;
  username: string;
  display_name: string | null;
  group_name: string | null;
}

export default function AdminAdsPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [ads, setAds] = useState<AdminAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

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

  const fetchPendingAds = useCallback(async () => {
    setLoadingAds(true);
    setApiError(null);
    try {
      const token = storage.getAccessToken();
      const response = await fetch(`${API_BASE}/ads/admin?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAds(data.data.ads || []);
      } else {
        setApiError(data.message || "Failed to load pending ads");
      }
    } catch (err: any) {
      setApiError(`Network error: ${err.message}`);
    } finally {
      setLoadingAds(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) fetchPendingAds();
  }, [authorized, fetchPendingAds]);

  const handleAction = async (adId: string, status: "approved" | "rejected") => {
    setActioningId(adId);
    try {
      const token = storage.getAccessToken();
      const response = await fetch(`${API_BASE}/ads/${adId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchPendingAds();
      } else {
        setApiError(data.message || `Failed to ${status === "approved" ? "approve" : "reject"} ad`);
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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
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
                <h1 className="font-bold text-lg leading-tight">Ad Approvals</h1>
                <p className="text-gray-500 text-xs">Review ads submitted by groups awaiting approval</p>
              </div>
            </div>
            <button
              onClick={fetchPendingAds}
              className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <Loader2 className={`w-4 h-4 ${loadingAds ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* API Error Banner */}
          {apiError && (
            <div className="mb-6 flex items-start gap-3 bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-5 py-4 text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Ads list */}
          {loadingAds ? (
            <div className="flex items-center justify-center py-24 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading…
            </div>
          ) : ads.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl py-24 text-center text-gray-600">
              No pending ads to review
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row gap-5"
                >
                  {/* Image preview */}
                  <div
                    className="flex-shrink-0 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{
                      width: ad.format === "160x600" ? "80px" : "182px",
                      height: ad.format === "160x600" ? "300px" : "45px",
                    }}
                  >
                    {ad.imageUrl ? (
                      <img src={ad.imageUrl} alt={ad.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageOff className="w-6 h-6 text-gray-600" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{ad.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full font-medium">
                        {ad.format}
                      </span>
                      <span>
                        Submitted by{" "}
                        <span className="text-gray-200 font-medium">
                          {ad.display_name || ad.username}
                        </span>
                      </span>
                      <span>
                        Group:{" "}
                        <span className="text-gray-200 font-medium">
                          {ad.group_name || "—"}
                        </span>
                      </span>
                      {ad.createdAt && (
                        <span>
                          Submitted {new Date(ad.createdAt).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 flex-shrink-0 justify-end">
                    <button
                      onClick={() => handleAction(ad.id, "approved")}
                      disabled={actioningId === ad.id}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actioningId === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(ad.id, "rejected")}
                      disabled={actioningId === ad.id}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actioningId === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
