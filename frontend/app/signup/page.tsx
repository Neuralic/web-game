"use client";

import Link from "next/link";
import SignupForm from "../components/SignupForm";
import Footer from "../components/Footer";
import PublicRoute from "../components/PublicRoute";

const SignupPage = () => {
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
          {/* Header */}
          <header className="flex items-center justify-between gap-4 px-6 py-3">
            {/* Left - Empty spacer */}
            <div className="flex-1"></div>

            {/* Center - Logo */}
            <div className="flex items-center justify-center">
              <div className="glass-card px-8 py-3 rounded-xl">
                <h1
                  className="text-3xl font-black text-white tracking-wider uppercase"
                  style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
                >
                  ADVENTUREBLOX
                </h1>
              </div>
            </div>

            {/* Right - Login button */}
            <div className="flex-1 flex justify-end items-center gap-2">
              <Link
                href="/login"
                className="bg-white text-gray-900 font-bold px-5 py-2 rounded hover:bg-gray-100 transition-colors text-sm"
              >
                Log In
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <SignupForm />
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </PublicRoute>
  );
};

export default SignupPage;
