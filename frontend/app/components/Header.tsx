"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, Bell, Settings as SettingsIcon } from "lucide-react";
import VerifiedBadge from "./VerifiedBadge";
import { logout, isAuthenticated } from "@/lib/auth";
import { usersApi } from "@/lib/api";
import UserAvatar from "./UserAvatar";
import SwitchAccountsModal from "./SwitchAccountsModal";
import NotificationDropdown from "./NotificationDropdown";
import SearchBox from "./search/SearchBox";
import { useNotifications } from "@/contexts/NotificationContext";

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
    id?: string;
    username?: string;
    display_name?: string;
    is_verified?: boolean;
    balance?: number;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSwitchAccountsModal, setShowSwitchAccountsModal] = useState(false);
  const [switchSuccess, setSwitchSuccess] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { unreadCount } = useNotifications();

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
            // API failed but token might still be valid (refresh in progress)
            // Only mark as logged out if token is actually gone
            const tokenStillExists = isAuthenticated();
            if (!tokenStillExists) {
              setIsLoggedIn(false);
            }
            // If token exists, keep showing logged-in state — user data will load on next render
          }
        } catch {
          // Network error — don't change auth state if token exists
          const tokenStillExists = isAuthenticated();
          if (!tokenStillExists) {
            setIsLoggedIn(false);
          }
        }
      }
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

  // Display user data immediately without loading states
  const displayUsername = user?.username ?? "";
  const displayName = user?.display_name ?? user?.username ?? "";
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

      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
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
              <Image src="/logo.png" width={36} height={36} alt="AdventureBlox logo" priority className="rounded-lg object-cover" />
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <Link
                href="/games"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold text-base px-5 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Games
              </Link>
              <Link
                href="/catalog"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold text-base px-5 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Catalog
              </Link>
              <Link
                href="/create"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold text-base px-5 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Create
              </Link>
              <Link
                href="/forums"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold text-base px-5 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Forums
              </Link>
              {/* AdventureBux tab hidden from navigation
              <Link
                href="/adventurebux"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold text-base px-5 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                AdventureBux
              </Link>
              */}
            </nav>

            {/* Search: suggestions dropdown on desktop, full-screen overlay on phones */}
            <div className="hidden md:flex items-center flex-1 min-w-0">
              <SearchBox value={searchQuery} onChange={setSearchQuery} />
            </div>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Search"
              className="md:hidden ml-auto p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
            >
              <Search className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Right Section - Dynamic based on auth state */}
          <div className="flex items-center gap-2 flex-shrink-0">
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
                  {displayName && (
                    <span className="text-gray-900 dark:text-gray-100 font-medium text-sm hidden lg:flex items-center gap-1">
                      {displayName}
                      {userIsVerified && <VerifiedBadge size="sm" />}
                    </span>
                  )}
                  <UserAvatar userId={user?.id || ""} username={displayName} size={40} headshot />
                </Link>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative transition-colors"
                  >
                    <Bell className="w-9 h-9 text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[20px] h-[20px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown 
                    isOpen={notificationOpen} 
                    onClose={() => setNotificationOpen(false)} 
                  />
                </div>

                {/* Currency Display with Hover Dropdown */}
                <div className="relative group">
                  <div className="flex items-center gap-1.5 cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="w-9 h-9 relative flex-shrink-0">
                      <Image
                        src="/icons/currency_black.png"
                        alt="Currency"
                        width={40}
                        height={40}
                        className="block dark:hidden"
                      />
                      <Image
                        src="/icons/currency_white.png"
                        alt="Currency"
                        width={40}
                        height={40}
                        className="hidden dark:block"
                      />
                    </div>
                    <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm">
                      {user?.balance?.toLocaleString() ?? 0}
                    </span>
                  </div>

                  {/* Hover Dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-200 dark:border-[#2a2a2a] py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                    <Link
                      href="/adventurebux"
                      className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                    >
                      Buy AdventureBux
                    </Link>
                    {/* Redeem tab hidden from navigation
                    <Link
                      href="/adventurebux/redeem"
                      className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                    >
                      Redeem Codes
                    </Link>
                    */}
                    <Link
                      href="/adventurebux/gift"
                      className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                    >
                      Gift AdventureBux
                    </Link>
                    <Link
                      href="/adventurebux/giftcards"
                      className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                    >
                      Buy Gift Card
                    </Link>
                  </div>
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
                      <div className="fixed top-16 right-1 w-48 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-200 dark:border-[#2a2a2a] py-2 z-50">
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setSettingsOpen(false)}
                        >
                          Settings
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

      {/* Phone search: full-screen, opened by the search icon in the header */}
      {mobileSearchOpen && (
        <SearchBox variant="overlay" value={searchQuery} onChange={setSearchQuery} onClose={() => setMobileSearchOpen(false)} />
      )}
    </>
  );
}
