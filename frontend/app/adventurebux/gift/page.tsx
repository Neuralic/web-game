"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import UserAdBanner from "../../components/UserAdBanner";
import { usersApi, storage } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const GiftAdventureBuxPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recipientUsername, setRecipientUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  const presetAmounts = [10, 25, 50, 100, 250, 500, 1000];

  useEffect(() => {
    const token = storage.getAccessToken();
    if (!token) return;
    fetch(`${API_BASE}/users/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.user?.balance != null) {
          setBalance(data.data.user.balance);
        }
      })
      .catch(() => {});
  }, []);

  const handleSendGift = async () => {
    if (!recipientUsername.trim() || !amount || parseInt(amount) <= 0) return;
    setError(null);
    setSending(true);
    try {
      const response = await usersApi.giftAdventureBux({
        recipientUsername: recipientUsername.trim(),
        amount: parseInt(amount, 10),
      });
      if (response.success) {
        if (response.data?.balance != null) setBalance(response.data.balance);
        setStep("success");
      } else {
        setError(response.message || response.error || "Failed to send gift");
        setStep("confirm");
      }
    } catch {
      setError("Network error. Please try again.");
      setStep("confirm");
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setRecipientUsername("");
    setAmount("");
    setMessage("");
    setError(null);
    setStep("form");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex justify-center gap-4 px-4 py-8 w-full">
        {/* Left Skyscraper Ad */}
        <div className="hidden xl:block flex-shrink-0">
          <UserAdBanner format="160x600" />
        </div>

        <main className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gift AdventureBux</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">Send AdventureBux from your balance to any user on the platform</p>

<div className="flex justify-center mb-6">
  <UserAdBanner format="728x90" />
</div>

        <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
          {/* Balance */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-[#2a2a2a]">
            <span className="text-sm text-gray-600 dark:text-gray-400">Your Balance</span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">◈ {balance.toLocaleString()}</span>
          </div>

          {step === "success" ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Gift Sent!</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ◈ {amount} was sent to @{recipientUsername}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">New balance: ◈ {balance.toLocaleString()}</p>
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Send Another Gift
              </button>
            </div>
          ) : step === "form" ? (
            <div className="space-y-6">
              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipient Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={recipientUsername}
                    onChange={(e) => setRecipientUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(String(preset))}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                        amount === String(preset)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-[#242424] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-[#2a2a2a] hover:border-blue-400"
                      }`}
                    >
                      ◈ {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{message.length}/200</p>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => {
                  if (recipientUsername.trim() && amount && parseInt(amount) > 0) {
                    setStep("confirm");
                  }
                }}
                disabled={!recipientUsername.trim() || !amount || parseInt(amount) <= 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Confirmation */}
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🎁</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Confirm Gift</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  You are about to send AdventureBux
                </p>
              </div>

              <div className="bg-white dark:bg-[#242424] rounded-lg p-4 space-y-3 border border-gray-200 dark:border-[#2a2a2a]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">To</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">@{recipientUsername}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">◈ {amount}</span>
                </div>
                {message && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Message</span>
                    <span className="text-gray-900 dark:text-gray-100 text-right max-w-[200px] truncate">{message}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-3 border-t border-gray-200 dark:border-[#2a2a2a]">
                  <span className="text-gray-500 dark:text-gray-400">Remaining Balance</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">◈ {Math.max(0, balance - parseInt(amount || "0")).toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setError(null); setStep("form"); }}
                  className="flex-1 py-3 bg-gray-200 dark:bg-[#242424] hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSendGift}
                  disabled={sending}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {sending ? "Sending..." : "Send Gift"}
                </button>
              </div>
            </div>
          )}
        </div>
        </main>

        {/* Right Skyscraper Ad */}
        <div className="hidden xl:block flex-shrink-0">
          <UserAdBanner format="160x600" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default GiftAdventureBuxPage;
