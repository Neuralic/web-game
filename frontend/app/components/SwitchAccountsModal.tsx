"use client";

import { useState, useEffect } from "react";
import { X, Check, Plus, Loader2 } from "lucide-react";
import { accountsApi, storage } from "@/lib/api";
import { useRouter } from "next/navigation";
import UserAvatar from "./UserAvatar";

interface SwitchAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchSuccess: () => void;
}

interface Account {
  id: string;
  account_user_id: string;
  username: string;
  display_name: string;
  is_verified: boolean;
  is_active: boolean;
  added_at: string;
  last_used_at: string;
}

export default function SwitchAccountsModal({
  isOpen,
  onClose,
  onSwitchSuccess,
}: SwitchAccountsModalProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await accountsApi.getAccounts();

      if (response.success && response.data) {
        setAccounts((response.data.accounts || []) as Account[]);
      } else {
        setError(response.error || "Failed to load accounts");
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async (accountId: string) => {
    setSwitching(true);
    setError(null);

    try {
      const response = await accountsApi.switchAccount(accountId);

      if (response.success && response.data) {
        const data = response.data as {
          accessToken: string;
          refreshToken: string;
        };
        // Update tokens in localStorage
        storage.setTokens(data.accessToken, data.refreshToken);

        // Close modal and trigger success callback
        onClose();
        onSwitchSuccess();
      } else {
        setError(response.error || "Failed to switch account");
      }
    } catch (err) {
      console.error("Error switching account:", err);
      setError("Failed to switch account");
    } finally {
      setSwitching(false);
    }
  };

  const handleRemoveAccount = async (
    accountId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to remove this account?")) {
      return;
    }

    try {
      const response = await accountsApi.removeAccount(accountId);

      if (response.success) {
        // Refresh accounts list
        fetchAccounts();
      } else {
        setError(response.error || "Failed to remove account");
      }
    } catch (err) {
      console.error("Error removing account:", err);
      setError("Failed to remove account");
    }
  };

  const handleAddAccount = () => {
    // Store flag in localStorage so login page knows to add account
    localStorage.setItem("addingAccount", "true");

    // Redirect to login page
    onClose();
    router.push("/login");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md z-[101]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Switch Accounts
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          /* Account List */
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No accounts added yet
              </div>
            ) : (
              accounts.map((account) => {
                const isCurrent = account.is_active;

                return (
                  <div
                    key={account.id}
                    onClick={() =>
                      !switching &&
                      !isCurrent &&
                      handleSwitchAccount(account.id)
                    }
                    className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative group ${
                      switching || isCurrent
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {/* Avatar */}
                    <UserAvatar userId={account.account_user_id} username={account.display_name} size={48} headshot />

                    {/* Account Info */}
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {account.display_name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        @{account.username}
                      </div>
                    </div>

                    {/* Current Indicator */}
                    {isCurrent && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Remove Button */}
                    {!isCurrent && (
                      <button
                        onClick={(e) => handleRemoveAccount(account.id, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {/* Add Account Button */}
            <button
              onClick={handleAddAccount}
              disabled={switching}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Plus Icon */}
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>

              {/* Text */}
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Add Account
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
