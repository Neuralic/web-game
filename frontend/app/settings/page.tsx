"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPerson, faPersonDress } from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { usersApi, adsApi } from "@/lib/api";
import UserAdBanner from "../components/UserAdBanner";

interface UserData {
  username?: string;
  display_name?: string;
  is_verified?: boolean;
  birth_month?: string;
  birth_day?: number;
  birth_year?: number;
  gender?: string;
  email?: string;
  roblox_username?: string;
  roblox_id?: string;
  roblox_avatar_url?: string;
  can_receive_messages?: string;
  can_follow?: string;
  can_view_inventory?: string;
}

const SettingsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("account-info");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [robloxUsername, setRobloxUsername] = useState("");
  const [connectingRoblox, setConnectingRoblox] = useState(false);
  const [disconnectingRoblox, setDisconnectingRoblox] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [kick, setKick] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitch, setTwitch] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [socialVisibility, setSocialVisibility] = useState("no-one");

  // Privacy state
  const [canReceiveMessages, setCanReceiveMessages] = useState("friends");
  const [canFollow, setCanFollow] = useState("everyone");
  const [canViewInventory, setCanViewInventory] = useState("everyone");
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState({
    friendRequests: true,
    friendRequestAccepted: true,
    groupInvites: true,
    groupWallPosts: true,
    privateMessages: true,
    adventureBux: true,
    gameUpdates: true,
    platformAnnouncements: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
const [showPasswordModal, setShowPasswordModal] = useState(false);
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [changingPassword, setChangingPassword] = useState(false);

const [adName, setAdName] = useState("");
const [adFormat, setAdFormat] = useState("728x90");
const [adImageUrl, setAdImageUrl] = useState("");
const [adBid, setAdBid] = useState("0");
const [adGroupId, setAdGroupId] = useState("");
const [myAds, setMyAds] = useState<any[]>([]);
const [submittingAd, setSubmittingAd] = useState(false);
const [adTab, setAdTab] = useState<"create" | "manage">("create");

  // Email editing state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await usersApi.getCurrentUser();
        if (response.success && response.data) {
          const userData = response.data.user as UserData;
          setUser(userData);
          setDisplayName(userData.display_name || userData.username || "");
          setSelectedGender(userData.gender || "");
          setNewEmail(userData.email || "");
          setRobloxUsername(userData.roblox_username || "");
          if (userData.can_receive_messages) setCanReceiveMessages(userData.can_receive_messages);
          if (userData.can_follow) setCanFollow(userData.can_follow);
          if (userData.can_view_inventory) setCanViewInventory(userData.can_view_inventory);
        }

        const socialResponse = await usersApi.getMySocialLinks();
        if (socialResponse.success && socialResponse.data) {
          const links = socialResponse.data.socialLinks || [];
          links.forEach((link: any) => {
            if (link.platform === 'kick') setKick(link.url);
            if (link.platform === 'twitter') setTwitter(link.url);
            if (link.platform === 'youtube') setYoutube(link.url);
            if (link.platform === 'twitch') setTwitch(link.url);
            if (link.platform === 'instagram') setInstagram(link.url);
            if (link.platform === 'tiktok') setTiktok(link.url);
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSavePersonalInfo = async () => {
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const updateData: { displayName?: string; gender?: string } = {};
      if (displayName !== user?.display_name && displayName !== user?.username) {
        updateData.displayName = displayName;
      }
      updateData.gender = selectedGender;

      const response = await usersApi.updateProfile(updateData);
      if (!response.success) {
        setErrorMessage(response.message || "Failed to update personal info");
        setSaving(false);
        return;
      }

      const refreshResponse = await usersApi.getCurrentUser();
      if (refreshResponse.success && refreshResponse.data) {
        setUser(refreshResponse.data.user as UserData);
      }

      setSuccessMessage("Personal information updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!newEmail.trim()) { setErrorMessage("Email cannot be empty"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setErrorMessage("Please enter a valid email address"); return; }

    setSavingEmail(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await usersApi.updateProfile({ email: newEmail.trim() });
      if (response.success) {
        const refreshResponse = await usersApi.getCurrentUser();
        if (refreshResponse.success && refreshResponse.data) {
          setUser(refreshResponse.data.user as UserData);
        }
        setIsEditingEmail(false);
        setSuccessMessage("Email updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(response.message || "Failed to update email");
      }
    } catch (error) {
      setErrorMessage("Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleConnectRoblox = async () => {
    if (!robloxUsername.trim()) { setErrorMessage("Please enter your Roblox username"); return; }
    setConnectingRoblox(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const response = await usersApi.connectRoblox(robloxUsername.trim());
      if (response.success) {
        const refreshResponse = await usersApi.getCurrentUser();
        if (refreshResponse.success && refreshResponse.data) {
          setUser(refreshResponse.data.user as UserData);
        }
        setSuccessMessage("Roblox account connected successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage((response as any).message || "Failed to connect Roblox account");
      }
    } catch (error) {
      setErrorMessage("Failed to connect Roblox account");
    } finally {
      setConnectingRoblox(false);
    }
  };

  const handleDisconnectRoblox = async () => {
    if (!confirm("Are you sure you want to disconnect your Roblox account?")) return;
    setDisconnectingRoblox(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const response = await usersApi.disconnectRoblox();
      if (response.success) {
        setUser(prev => prev ? { ...prev, roblox_username: undefined, roblox_id: undefined, roblox_avatar_url: undefined } : prev);
        setRobloxUsername("");
        setSuccessMessage("Roblox account disconnected successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage((response as any).message || "Failed to disconnect Roblox account");
      }
    } catch (error) {
      setErrorMessage("Failed to disconnect Roblox account");
    } finally {
      setDisconnectingRoblox(false);
    }
  };

  const handleSaveSocialNetworks = async () => {
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const socialData = [
        { platform: "kick", url: kick },
        { platform: "twitter", url: twitter },
        { platform: "youtube", url: youtube },
        { platform: "twitch", url: twitch },
        { platform: "instagram", url: instagram },
        { platform: "tiktok", url: tiktok },
      ];

      for (const social of socialData) {
        if (social.url.trim()) {
          let url = social.url.trim();
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          await usersApi.upsertSocialLink(social.platform, url);
        }
      }

      await usersApi.updateProfile({ socialVisibility });

      const refreshResponse = await usersApi.getCurrentUser();
      if (refreshResponse.success && refreshResponse.data) {
        setUser(refreshResponse.data.user as UserData);
      }

      setSuccessMessage("Social networks updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating social networks:", error);
      setErrorMessage("Failed to update social networks");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await usersApi.updateProfileSettings({
        canReceiveMessages,
        canFollow,
        canViewInventory,
      });

      if (response.success) {
        setSuccessMessage("Privacy settings saved!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage((response as any).message || "Failed to save privacy settings");
      }
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      setErrorMessage("Failed to save privacy settings");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    setSuccessMessage("");
    setErrorMessage("");
    await new Promise(resolve => setTimeout(resolve, 500));
    setSuccessMessage("Notification preferences saved!");
    setTimeout(() => setSuccessMessage(""), 3000);
    setSavingNotifications(false);
  };

  const settingsSections = [
    { id: "account-info", label: "Account info" },
    { id: "security", label: "Security" },
    { id: "privacy", label: "Privacy & content restrictions" },
    { id: "notifications", label: "Notifications" },
    { id: "membership", label: "Membership" },
    { id: "user-ads", label: "User Ads" },
    { id: "parental", label: "Parental controls" },
  ];

  const privacyOptions = [
    { value: "everyone", label: "Everyone" },
    { value: "friends", label: "Friends only" },
    { value: "no_one", label: "No one" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex justify-center mb-4">
          <UserAdBanner format="728x90" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Settings</h1>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-green-800 dark:text-green-200 text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-6">
          <aside className="w-52 flex-shrink-0">
            <nav className="space-y-0.5">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors border-l-3 ${
                    activeSection === section.id
                      ? "border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold"
                      : "border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 max-w-2xl">
            {activeSection === "account-info" && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Account Info</h2>

                {/* Display Name */}
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Display Name:</div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    placeholder="Enter display name"
                  />
                </div>

                {/* Username */}
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Username:</div>
                      <div className="text-gray-900 dark:text-gray-100">{user?.username || "Not set"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Username cannot be changed</div>
                    </div>
                    <button className="text-blue-600 dark:text-blue-400 p-1 opacity-50 cursor-not-allowed">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email:</div>
                      {isEditingEmail ? (
                        <div className="space-y-2">
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                            placeholder="Enter email address"
                          />
                          <div className="flex gap-2">
                            <button onClick={handleSaveEmail} disabled={savingEmail} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded disabled:opacity-50">
                              {savingEmail ? "Saving..." : "Save Email"}
                            </button>
                            <button onClick={() => { setIsEditingEmail(false); setNewEmail(user?.email || ""); setErrorMessage(""); }} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          {user?.email || "Not set"}
                          {user?.is_verified && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              Verified
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {!isEditingEmail && (
                      <button onClick={() => setIsEditingEmail(true)} className="text-blue-600 dark:text-blue-400 p-1 hover:opacity-80">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Personal Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Personal</h3>

                  <div className="mb-3">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Age Group:</div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user?.birth_year ? new Date().getFullYear() - user.birth_year >= 18 ? "18+" : "Under 18" : "Not set"}
                    </div>
                  </div>

                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Birthday:</div>
                        <div className="text-gray-900 dark:text-gray-100">
                          {user?.birth_month && user?.birth_day && user?.birth_year ? `${user.birth_month} ${user.birth_day}, ${user.birth_year}` : "Not set"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Birthday cannot be changed</div>
                      </div>
                      <button className="text-blue-600 dark:text-blue-400 p-1 opacity-50 cursor-not-allowed">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Gender (Optional)</div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedGender(selectedGender === "female" ? "" : "female")}
                        className={`flex-1 border rounded py-3 flex items-center justify-center transition-colors ${selectedGender === "female" ? "border-pink-500 bg-pink-500/20 text-pink-500 dark:bg-pink-500/30" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                      >
                        <FontAwesomeIcon icon={faPersonDress} className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedGender(selectedGender === "male" ? "" : "male")}
                        className={`flex-1 border rounded py-3 flex items-center justify-center transition-colors ${selectedGender === "male" ? "border-blue-500 bg-blue-500/20 text-blue-500 dark:bg-blue-500/30" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                      >
                        <FontAwesomeIcon icon={faPerson} className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click again to deselect</p>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Language</div>
                    <select className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700">
                      <option>English (United States)</option>
                    </select>
                  </div>

                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Account Location:</div>
                    <div className="text-gray-900 dark:text-gray-100">Nigeria</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on signup location</div>
                  </div>

                  <button onClick={handleSavePersonalInfo} disabled={saving} className="px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? "Saving..." : "Save Personal Info"}
                  </button>
                </div>

                {/* Roblox Account */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Roblox Account</h3>
                  {user?.roblox_username ? (
                    <div className="flex items-center gap-4">
                      {user.roblox_avatar_url && (
                        <img src={user.roblox_avatar_url} alt={user.roblox_username} className="w-16 h-16 rounded-full border border-gray-200 dark:border-gray-700" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.roblox_username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Roblox ID: {user.roblox_id}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Connected</p>
                      </div>
                      <button onClick={handleDisconnectRoblox} disabled={disconnectingRoblox} className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50">
                        {disconnectingRoblox ? "Disconnecting..." : "Disconnect"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Connect your Roblox account to unlock platform features.</p>
                      <div className="flex gap-2">
                        <input type="text" value={robloxUsername} onChange={(e) => setRobloxUsername(e.target.value)} placeholder="Enter your Roblox username" className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700" />
                        <button onClick={handleConnectRoblox} disabled={connectingRoblox} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded disabled:opacity-50">
                          {connectingRoblox ? "Connecting..." : "Connect"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Networks */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Social Networks</h3>
                  <div className="space-y-3 mb-3">
                    {[
                      { label: "Kick Streaming", value: kick, setter: setKick, placeholder: "e.g. kick.com/adventureblox" },
                      { label: "X (formerly Twitter)", value: twitter, setter: setTwitter, placeholder: "e.g. @AdventureBlox" },
                      { label: "YouTube", value: youtube, setter: setYoutube, placeholder: "e.g. www.youtube.com/user/adventureblox" },
                      { label: "Twitch", value: twitch, setter: setTwitch, placeholder: "e.g. www.twitch.tv/adventureblox/profile" },
                      { label: "Instagram", value: instagram, setter: setInstagram, placeholder: "e.g. www.instagram.com/adventureblox" },
                      { label: "TikTok", value: tiktok, setter: setTiktok, placeholder: "e.g. www.tiktok.com/@adventureblox" },
                    ].map((field) => (
                      <div key={field.label}>
                        <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">{field.label}</label>
                        <input type="text" value={field.value} onChange={(e) => field.setter(e.target.value)} placeholder={field.placeholder} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Social networks visibility</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Who can see links to your social network profiles</p>
                    <div className="space-y-2">
                      {[
                        { value: "everyone", label: "Everyone" },
                        { value: "friends-followers", label: "Friends, followers & people I follow" },
                        { value: "friends-following", label: "Friends & people I follow" },
                        { value: "friends", label: "Friends" },
                        { value: "no-one", label: "No one" },
                      ].map((option) => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="visibility" value={option.value} checked={socialVisibility === option.value} onChange={(e) => setSocialVisibility(e.target.value)} className="w-4 h-4" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleSaveSocialNetworks} disabled={saving} className="px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving ? "Saving..." : "Save Social Networks"}
                  </button>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Security</h2>
                <div className="space-y-6">
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Password</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Change your account password</p>
                    <button
  onClick={() => setShowPasswordModal(true)}
  className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-200"
>Change Password</button>
                  </div>
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Add an extra layer of security to your account</p>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-sm">Enable 2FA</button>
                  </div>
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Login History</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">View recent login activity on your account</p>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-xs text-gray-600 dark:text-gray-300">No recent login activity found.</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Delete Account</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Permanently delete your AdventureBlox account and all associated data</p>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-sm">Delete Account</button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "privacy" && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Privacy & Content Restrictions</h2>
                <div className="space-y-6">
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Who can message me</h3>
                    <div className="space-y-2">
                      {privacyOptions.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="message_privacy" value={opt.value} checked={canReceiveMessages === opt.value} onChange={(e) => setCanReceiveMessages(e.target.value)} className="w-4 h-4" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Who can follow me</h3>
                    <div className="space-y-2">
                      {privacyOptions.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="follow_privacy" value={opt.value} checked={canFollow === opt.value} onChange={(e) => setCanFollow(e.target.value)} className="w-4 h-4" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Who can see my inventory</h3>
                    <div className="space-y-2">
                      {privacyOptions.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="inventory_privacy" value={opt.value} checked={canViewInventory === opt.value} onChange={(e) => setCanViewInventory(e.target.value)} className="w-4 h-4" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Content restrictions</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4" />
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">Filter mature content</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Hide games and items marked as mature</p>
                      </div>
                    </label>
                  </div>
                  <button onClick={handleSavePrivacy} disabled={savingPrivacy} className="px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {savingPrivacy ? "Saving..." : "Save Privacy Settings"}
                  </button>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Notifications</h2>
                <div className="space-y-1 mb-6">
                  {[
                    { key: "friendRequests", label: "Friend requests", desc: "When someone sends you a friend request" },
                    { key: "friendRequestAccepted", label: "Friend request accepted", desc: "When someone accepts your friend request" },
                    { key: "groupInvites", label: "Group invites", desc: "When someone invites you to a group" },
                    { key: "groupWallPosts", label: "Group wall posts", desc: "When someone posts on your group wall" },
                    { key: "privateMessages", label: "Private messages", desc: "When someone sends you a message" },
                    { key: "adventureBux", label: "AdventureBux received", desc: "When you receive AdventureBux" },
                    { key: "gameUpdates", label: "Game updates", desc: "Updates from games you follow" },
                    { key: "platformAnnouncements", label: "Platform announcements", desc: "Important announcements from AdventureBlox" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notifications[item.key as keyof typeof notifications]} onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveNotifications} disabled={savingNotifications} className="px-4 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {savingNotifications ? "Saving..." : "Save Notification Preferences"}
                </button>
              </div>
            )}

            {activeSection === "membership" && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Membership</h2>
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
                  <h3 className="text-lg font-bold mb-1">AdventureBlox Free</h3>
                  <p className="text-sm text-white/80">Your current plan</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">AdventureBlox Premium</h3>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">$4.99<span className="text-sm font-normal text-gray-500">/month</span></p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded">Recommended</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {["1,000 AdventureBux per month", "Up to 35% bonus on AdventureBux purchases", "Trade and resell avatar items", "Exclusive premium badge on profile", "Priority customer support"].map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-green-500">✓</span> {perk}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm">Upgrade to Premium</button>
                </div>
              </div>
            )}

            {activeSection === "user-ads" && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">User Ads</h2>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                  <button
                    onClick={() => setAdTab("create")}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${adTab === "create" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                  >Create Ad</button>
                  <button
                    onClick={async () => {
                      setAdTab("manage");
                      const res = await adsApi.getMyAds();
                      if (res.success) setMyAds((res.data as any)?.ads || []);
                    }}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${adTab === "manage" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                  >Manage Ads</button>
                </div>

                {adTab === "manage" && (
                  <div>
                    {myAds.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No ads yet. Create your first ad.</p>
                    ) : (
                      <div className="space-y-4">
                        {myAds.map((ad: any) => (
                          <div key={ad.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex gap-4 items-start">
                            <img src={ad.imageUrl} alt={ad.name} className="w-24 h-12 object-cover rounded border border-gray-200 dark:border-gray-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ad.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{ad.format} · {ad.group_name || "No group"}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  ad.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  ad.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>{ad.status}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{ad.impressions} views · {ad.clicks} clicks</span>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                const res = await adsApi.deleteAd(ad.id);
                                if (res.success) setMyAds(myAds.filter((a: any) => a.id !== ad.id));
                              }}
                              className="text-red-500 hover:text-red-600 text-xs font-medium flex-shrink-0"
                            >Delete</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {adTab === "create" && <>
                {/* Ad Format */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Select Ad Format</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Download, edit and upload one of the following templates:</p>
                  <div className="flex gap-3">
                    {[
  { label: "728 x 90 Banner", value: "728x90" },
  { label: "160 x 600 Skyscraper", value: "160x600" },
].map((f) => (
  <button
    key={f.value}
    onClick={() => {
  setAdFormat(f.value);
  const link = document.createElement('a');
  link.href = `/ad-templates/${f.value}-template.png`;
  link.download = `adventureblox-${f.value}-ad-template.png`;
  link.click();
}}
    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
      adFormat === f.value
        ? "border-blue-600 bg-blue-600 text-white"
        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
    }`}
  >
    {f.label}
  </button>
))}
                  </div>
                </div>

                {/* Ad Name */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name your Ad</label>
                 <input type="text" value={adName} onChange={(e) => setAdName(e.target.value)} placeholder="Enter ad name" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700" />
                </div>

                {/* Upload Ad */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ad Image URL</label>
                    <input type="text" value={adImageUrl} onChange={(e) => setAdImageUrl(e.target.value)} placeholder="https://..." className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700" />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload an Ad</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Drag an image here</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">- Or -</p>
                    <label className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
  Select an image from your computer
  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { setErrorMessage("Image must be under 5MB"); return; }
      try {
        const { uploadApi } = await import("@/lib/api");
        const res = await uploadApi.uploadImage(file, 'ad-image');
        if (res.success && res.data) {
          setAdImageUrl((res.data as any).url);
          setSuccessMessage("Image uploaded!");
          setTimeout(() => setSuccessMessage(""), 2000);
        } else {
          setErrorMessage("Failed to upload image");
        }
      } catch { setErrorMessage("Failed to upload image"); }
    }}
  />
</label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">The ad needs to be approved by a Moderator before it can be launched from your Ad Page</p>


                </div>

                {/* Bidding */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Bidding</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Set how many AdventureBux you want to bid per day to run your ad</p>
                  <div className="flex items-center gap-3">
                    <input type="number" min="0" value={adBid} onChange={(e) => setAdBid(e.target.value)} placeholder="0" className="w-32 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">AdventureBux / day</span>
                  </div>
                </div>

                <button
  onClick={async () => {
    if (!adName.trim()) { setErrorMessage("Ad name is required"); return; }
    if (!adImageUrl.trim()) { setErrorMessage("Ad image URL is required"); return; }
    setSubmittingAd(true);
    setErrorMessage("");
    try {
      const response = await adsApi.createAd({
        name: adName,
        format: adFormat,
        imageUrl: adImageUrl,
        bidPerDay: parseInt(adBid) || 0,
        groupId: adGroupId || undefined,
      });
      if (response.success) {
        setSuccessMessage("Ad submitted for review!");
        setAdName(""); setAdImageUrl(""); setAdBid("0"); setAdGroupId("");
        setTimeout(() => setSuccessMessage(""), 3000);
        // Refresh my ads
        const adsResponse = await adsApi.getMyAds();
        if (adsResponse.success) setMyAds((adsResponse.data as any)?.ads || []);
        setAdTab("manage");
      } else {
        setErrorMessage((response as any).message || "Failed to create ad");
      }
    } catch { setErrorMessage("Failed to create ad"); }
    finally { setSubmittingAd(false); }
  }}
  disabled={submittingAd}
  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
>
  {submittingAd ? "Submitting..." : "Create Ad"}
</button>
                </>}
              </div>
            )}

            {activeSection === "parental" && (
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Parental Controls</h2>
                <div className="space-y-6">
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Account PIN</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Set a PIN to prevent changes to parental control settings</p>
                    <button className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-200">Set PIN</button>
                  </div>
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Chat restrictions</h3>
                    <div className="space-y-2">
                      {["All users", "Friends only", "No one"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="chat_restriction" defaultChecked={opt === "Friends only"} className="w-4 h-4" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Spending limits</h3>
                    <div className="space-y-2">
                      {["No limit", "$5/month", "$10/month", "$25/month", "$50/month"].map((opt) => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="spending_limit" defaultChecked={opt === "No limit"} className="w-4 h-4" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Content filters</h3>
                    <div className="space-y-3">
                      {[
                        { label: "Safe chat mode", desc: "Only allow pre-approved messages" },
                        { label: "Block external links", desc: "Prevent clicking links to external websites" },
                        { label: "Hide user-generated content", desc: "Hide content created by other users" },
                      ].map((item) => (
                        <label key={item.label} className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{item.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <div className="mt-8">
        <Footer />
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Change Password</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700" />
              </div>
            </div>
            {errorMessage && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errorMessage}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPasswordModal(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setErrorMessage(""); }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg text-sm"
              >Cancel</button>
              <button
                onClick={async () => {
                  if (!currentPassword || !newPassword || !confirmPassword) { setErrorMessage("All fields are required"); return; }
                  if (newPassword !== confirmPassword) { setErrorMessage("New passwords don't match"); return; }
                  if (newPassword.length < 8) { setErrorMessage("New password must be at least 8 characters"); return; }
                  setChangingPassword(true);
                  setErrorMessage("");
                  try {
                    const token = (await import("@/lib/api")).storage.getAccessToken();
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/auth/change-password`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ currentPassword, newPassword }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setShowPasswordModal(false);
                      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                      setSuccessMessage("Password changed successfully!");
                      setTimeout(() => setSuccessMessage(""), 3000);
                    } else {
                      setErrorMessage(data.message || "Failed to change password");
                    }
                  } catch { setErrorMessage("Failed to change password"); }
                  finally { setChangingPassword(false); }
                }}
                disabled={changingPassword}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50"
              >{changingPassword ? "Changing..." : "Change Password"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
