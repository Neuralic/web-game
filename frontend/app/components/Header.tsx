"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, Bell, Settings as SettingsIcon } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import VerifiedBadge from "./VerifiedBadge";
import { logout, isAuthenticated } from "@/lib/auth";
import { usersApi } from "@/lib/api";
import SwitchAccountsModal from "./SwitchAccountsModal";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSidebarOpen: (open: boolean) => void;
  isVerified?: boolean;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  setSidebarOpen,
  isVerified = true,
}: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<{
    username?: string;
    display_name?: string;
    is_verified?: boolean;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSwitchAccountsModal, setShowSwitchAccountsModal] = useState(false);
  const [switchSuccess, setSwitchSuccess] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);

      if (authenticated) {
        // Fetch user data from API (database) only if authenticated
        try {
          const response = await usersApi.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data.user as typeof user);
          } else {
            // If token is invalid, clear auth state
            setIsLoggedIn(false);
          }
        } catch {
          setIsLoggedIn(false);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    setSettingsOpen(false);
    logout();
  };

  const handleSwitchAccountsClick = () => {
    setSettingsOpen(false);
    setShowSwitchAccountsModal(true);
  };

  const handleSwitchSuccess = () => {
    setShowSwitchAccountsModal(false);
    setSwitchSuccess(true);
    setTimeout(() => setSwitchSuccess(false), 3000);

    // Refresh user data and page
    window.location.href = "/home";
  };

  // Show loading or fallback if user data not loaded yet
  const displayUsername = user?.username ?? "Loading...";
  const displayName = user?.display_name ?? user?.username ?? "Loading...";
  const userIsVerified = user?.is_verified ?? isVerified;

  return (
    <>
      {/* Success Notification */}
      {switchSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[102] animate-slide-down">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <p className="font-semibold">
              You switched to {user?.username || "another account"}
            </p>
          </div>
        </div>
      )}

      {/* Switch Accounts Modal */}
      <SwitchAccountsModal
        isOpen={showSwitchAccountsModal}
        onClose={() => setShowSwitchAccountsModal(false)}
        onSwitchSuccess={handleSwitchSuccess}
      />

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          {/* Left Section - Takes more space */}
          <div className="flex items-center gap-4 flex-1">
            {/* Menu Button - Only show when logged in */}
            {isLoggedIn && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
              >
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}

            {/* Logo */}
            <Link
              href={isLoggedIn ? "/home" : "/signup"}
              className="flex-shrink-0"
            >
              <div className="w-9 h-9 bg-gray-800 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">◈</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
              <Link
                href="/games"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Games
              </Link>
              <Link
                href="/catalog"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Catalog
              </Link>
              <Link
                href="/create"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Create
              </Link>
              <Link
                href="/adventurebux"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                AdventureBux
              </Link>
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 w-64">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Right Section - Dynamic based on auth state */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme Toggle - Always visible */}
            <ThemeToggle />

            {!isLoggedIn ? (
              // NOT LOGGED IN - Show Sign Up / Log In buttons
              <>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded transition-colors"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              // LOGGED IN - Show user profile, notifications, currency, settings
              <>
                {/* User Profile */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <span className="text-gray-900 dark:text-gray-100 font-medium text-sm hidden lg:flex items-center gap-1">
                    {loading ? "Loading..." : displayName}
                    {!loading && userIsVerified && <VerifiedBadge size="sm" />}
                  </span>
                  <div className="w-9 h-9 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 overflow-hidden relative">
                    <Image
                      src="https://tr.rbxcdn.com/30DAY-AvatarHeadshot-903254C5702EE154B5EA564D1D4CB860-Png/150/150/AvatarHeadshot/Webp/noFilter"
                      alt={displayUsername}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Notifications */}
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative transition-colors">
                  <Bell className="w-7 h-7 text-gray-700 dark:text-gray-300" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Currency Display */}
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="w-9 h-9 relative flex-shrink-0">
                      <Image
                        src="/icons/currency_black.png"
                        alt="Currency"
                        width={36}
                        height={36}
                        className="block dark:hidden"
                      />
                      <Image
                        src="/icons/currency_white.png"
                        alt="Currency"
                        width={36}
                        height={36}
                        className="hidden dark:block"
                      />
                    </div>
                  </button>
                  <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm">
                    0
                  </span>
                </div>

                {/* Settings Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <SettingsIcon className="w-9 h-9 text-gray-700 dark:text-gray-300" />
                  </button>

                  {settingsOpen && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setSettingsOpen(false)}
                      ></div>

                      {/* Dropdown Menu */}
                      <div className="fixed top-16 right-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setSettingsOpen(false)}
                        >
                          Settings
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setSettingsOpen(false)}
                        >
                          Quick Sign In
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setSettingsOpen(false)}
                        >
                          Help & Safety
                        </Link>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={handleSwitchAccountsClick}
                        >
                          Switch Accounts
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={handleLogout}
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
