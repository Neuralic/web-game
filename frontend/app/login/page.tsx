"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Footer from "../components/Footer";
import PublicRoute from "../components/PublicRoute";
import { authApi, storage, accountsApi } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const LoginPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailCodeModal, setShowEmailCodeModal] = useState(false);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // Two-factor authentication (TOTP) step, shown after a successful password login
  // when the account has 2FA enabled — tokens from the password step are held here
  // until the code is verified.
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{ userId: string; accessToken: string; refreshToken: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  // Check if we're adding an account on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const addingAccount = localStorage.getItem("addingAccount");
      if (addingAccount === "true") {
        setIsAddingAccount(true);
      }
    }
  }, []);

  // Finishes the login flow (add-account or normal) once we have tokens we're
  // sure are safe to use — either straight from password login (no 2FA), or
  // after the 6-digit TOTP code has been verified.
  const completeLogin = async (accessToken: string, refreshToken: string, userId: string) => {
    if (isAddingAccount) {
      console.log("🔵 Adding account flow detected");
      console.log("🔵 Primary user token exists:", !!storage.getAccessToken());
      console.log("🔵 New account user ID:", userId);

      const addAccountResponse = await accountsApi.addAccount(userId, accessToken, refreshToken);

      console.log("🔵 Add account response:", addAccountResponse);

      localStorage.removeItem("addingAccount");

      if (addAccountResponse.success) {
        console.log("✅ Account added successfully, switching tokens");
        storage.setTokens(accessToken, refreshToken);
        router.push("/home");
      } else {
        console.error("❌ Failed to add account:", addAccountResponse.error);
        setErrors([addAccountResponse.error || "Failed to add account"]);
      }
    } else {
      storage.setTokens(accessToken, refreshToken);
      router.push("/home");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });

      if (response.success && response.data) {
        if (response.data.user.twoFactorEnabled) {
          // Hold the tokens until the 6-digit code is verified — don't
          // establish the session yet.
          setPendingLogin({
            userId: response.data.user.id,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          });
          setTwoFactorCode("");
          setTwoFactorError("");
          setShowTwoFactorModal(true);
          return;
        }

        await completeLogin(response.data.accessToken, response.data.refreshToken, response.data.user.id);
      } else {
        // Handle validation errors from backend
        if (
          response.errors &&
          Array.isArray(response.errors) &&
          response.errors.length > 0
        ) {
          setErrors(
            response.errors.map(
              (err: { msg?: string; message?: string }) =>
                err.msg || err.message || String(err),
            ),
          );
        } else if (response.message) {
          setErrors([response.message]);
        } else {
          setErrors(["Login failed. Please try again."]);
        }
      }
    } catch {
      setErrors(["An error occurred. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLogin) return;
    if (!/^\d{6}$/.test(twoFactorCode)) {
      setTwoFactorError("Verification code must be exactly 6 digits");
      return;
    }

    setVerifying2FA(true);
    setTwoFactorError("");
    try {
      const res = await fetch(`${API_BASE}/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingLogin.userId, token: twoFactorCode }),
      });
      const data = await res.json();
      if (data.success) {
        await completeLogin(pendingLogin.accessToken, pendingLogin.refreshToken, pendingLogin.userId);
        setShowTwoFactorModal(false);
        setPendingLogin(null);
        setTwoFactorCode("");
      } else {
        setTwoFactorError(data.message || "Invalid verification code");
      }
    } catch {
      setTwoFactorError("An error occurred. Please try again.");
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Send code to:", email);
    setShowEmailCodeModal(false);
  };

  return (
    <PublicRoute>
      <div
        className="min-h-screen bg-gray-900 bg-cover bg-center bg-no-repeat relative dark"
        style={{ backgroundImage: `url(/gaming-bg.jpg)` }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header with dark semi-transparent background */}
          <header className="bg-gray-900/70 backdrop-blur-sm flex items-center justify-between gap-4 px-6 py-2.5">
            {/* Left Section - Logo and Navigation */}
            <div className="flex items-center gap-4 flex-1">
              {/* Logo */}
              <Link href="/signup" className="flex-shrink-0">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-gray-700 hover:bg-white/20 transition-colors">
                  <span className="text-white font-bold text-lg">◈</span>
                </div>
              </Link>

              {/* Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                <a
                  href="/games"
                  className="text-gray-200 font-medium hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/10 text-sm"
                >
                  Games
                </a>
                <a
                  href="/catalog"
                  className="text-gray-200 font-medium hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/10 text-sm"
                >
                  Catalog
                </a>
                <a
                  href="/create"
                  className="text-gray-200 font-medium hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/10 text-sm"
                >
                  Create
                </a>
                <a
                  href="/adventurebux"
                  className="text-gray-200 font-medium hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/10 text-sm"
                >
                  AdventureBux
                </a>
              </nav>

              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 border border-gray-600 rounded-lg px-3 py-1.5 bg-gray-800/50 w-64">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-transparent text-white placeholder:text-gray-400 text-sm focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Right Section - Signup */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/signup">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded transition-colors text-sm">
                  Sign Up
                </button>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-lg p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-center text-white mb-8">
                Login to AdventureBlox
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username/Email/Phone Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Username/Email/Phone"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-400 h-12 px-4 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-400 h-12 px-4 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Error Messages */}
                {errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm">
                    {errors.length === 1 ? (
                      <div className="font-medium">{errors[0]}</div>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((err, index) => (
                          <li key={index}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 h-12 text-base rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </form>

              {/* Forgot Password */}
              <div className="text-center mt-6">
                <Link
                  href="/login/forgot-password-or-username"
                  className="text-white hover:underline text-sm font-medium"
                >
                  Forgot Password or Username?
                </Link>
              </div>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <span className="text-gray-400 text-sm">
                  Don&apos;t have an account?{" "}
                </span>
                <Link
                  href="/signup"
                  className="text-white hover:underline text-sm font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>

        {/* Email One-Time Code Modal */}
        {showEmailCodeModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowEmailCodeModal(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h2 className="text-xl font-bold text-center text-white mb-4">
                Get One-Time Code
              </h2>

              <p className="text-sm text-gray-400 mb-6">
                Enter the email verified on your account to receive a one-time
                code.
              </p>

              <form onSubmit={handleSendCode} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-400 h-12 px-4 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />

                <button
                  type="submit"
                  className="w-full bg-gray-700/70 border border-gray-600 text-white hover:bg-gray-700 h-12 rounded font-medium"
                >
                  Send Code
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  onClick={() => setShowEmailCodeModal(false)}
                  className="text-white hover:underline text-sm font-medium"
                >
                  Use Another Device
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two-Factor Authentication Modal */}
        {showTwoFactorModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => {
                  setShowTwoFactorModal(false);
                  setPendingLogin(null);
                  setTwoFactorCode("");
                  setTwoFactorError("");
                }}
                className="absolute top-4 right-4 text-white hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h2 className="text-xl font-bold text-center text-white mb-4">
                Two-Factor Authentication
              </h2>

              <p className="text-sm text-gray-400 mb-6">
                Enter the 6-digit code from your authenticator app to finish logging in.
              </p>

              <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-400 h-12 px-4 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center tracking-widest"
                  autoFocus
                />

                {twoFactorError && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm">
                    {twoFactorError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifying2FA || twoFactorCode.length !== 6}
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 h-12 text-base rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying2FA ? "Verifying..." : "Verify"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </PublicRoute>
  );
};

export default LoginPage;
