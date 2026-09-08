"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import ProtectedRoute from "../../components/ProtectedRoute";
import { storage } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface MyGroup {
  id: string;
  name: string;
  owner_id?: string;
}

interface MergeResult {
  name: string;
  description: string;
  membersImported: number;
}

export default function MergeGroupPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [robloxGroupId, setRobloxGroupId] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [merging, setMerging] = useState(false);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyGroups = async () => {
      const token = storage.getAccessToken();
      if (!token) return;

      let currentUserId: string | null = null;
      try {
        currentUserId = JSON.parse(atob(token.split(".")[1])).userId;
      } catch {}

      try {
        const res = await fetch(`${API_BASE}/groups/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const owned = (data.data.groups || []).filter(
            (g: MyGroup) => g.owner_id === currentUserId
          );
          setMyGroups(owned);
          if (owned.length > 0) setTargetGroupId(owned[0].id);
        }
      } catch {
        // ignore
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchMyGroups();
  }, []);

  const handleMerge = async () => {
    setError("");
    setResult(null);

    if (!robloxGroupId.trim()) {
      setError("Please enter a Roblox Group ID.");
      return;
    }
    if (!targetGroupId) {
      setError("Please select a group to merge into.");
      return;
    }

    const token = storage.getAccessToken();
    if (!token) return;

    setMerging(true);
    try {
      const res = await fetch(`${API_BASE}/groups/merge-from-roblox`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          robloxGroupId: robloxGroupId.trim(),
          targetGroupId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data.imported);
      } else {
        setError(data.message || "Merge failed.");
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setMerging(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-black flex flex-col">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex-1 flex justify-center px-4 py-10">
          <div className="w-full max-w-lg">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Merge Roblox Group
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
              Migrate your Roblox group to AdventureBlox. This will copy your
              group&apos;s name and description, and automatically add any
              Roblox members who already have an AdventureBlox account.
            </p>

            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-6 space-y-5">
              {/* Roblox Group ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Roblox Group ID
                </label>
                <input
                  type="text"
                  value={robloxGroupId}
                  onChange={(e) => setRobloxGroupId(e.target.value)}
                  placeholder="e.g. 12345678"
                  className="w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Find this in the URL of your Roblox group page:
                  roblox.com/groups/<strong>ID</strong>/name
                </p>
              </div>

              {/* Target group */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  AdventureBlox Group to merge into
                </label>
                {loadingGroups ? (
                  <div className="text-sm text-gray-400">Loading your groups...</div>
                ) : myGroups.length === 0 ? (
                  <div className="text-sm text-red-500 dark:text-red-400">
                    You don&apos;t own any AdventureBlox groups yet.{" "}
                    <a href="/groups/create" className="underline">
                      Create one first.
                    </a>
                  </div>
                ) : (
                  <select
                    value={targetGroupId}
                    onChange={(e) => setTargetGroupId(e.target.value)}
                    className="w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {myGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              {/* Result */}
              {result && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 space-y-1">
                  <p className="text-green-700 dark:text-green-300 font-semibold text-sm">
                    Merge complete!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Group updated to: <strong>{result.name}</strong>
                  </p>
                  {result.description && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Description imported.
                    </p>
                  )}
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Members added:{" "}
                    <strong>{result.membersImported}</strong>
                    {result.membersImported === 0 &&
                      " (none of your Roblox members have AdventureBlox accounts yet)"}
                  </p>
                </div>
              )}

              {/* Button */}
              <button
                onClick={handleMerge}
                disabled={merging || myGroups.length === 0}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {merging ? "Merging..." : "Merge Group"}
              </button>
            </div>

            {/* Info box */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
              <p className="font-semibold text-gray-700 dark:text-gray-300">What gets imported</p>
              <p>✓ Group name and description from Roblox</p>
              <p>✓ Members who already have an AdventureBlox account (matched by username)</p>
              <p className="font-semibold text-gray-700 dark:text-gray-300 pt-1">What does not get imported</p>
              <p>✗ Members without an AdventureBlox account</p>
              <p>✗ Group funds, shout, or rank/role structure</p>
              <p>✗ Your group&apos;s icon or banner image</p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
