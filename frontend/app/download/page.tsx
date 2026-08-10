"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import { Gamepad2, Wrench, Download } from "lucide-react";

const PLAYER_DOWNLOAD_URL =
  "https://fwjvihdbbnksqnhcsuse.supabase.co/storage/v1/object/public/Downloads/AdventureBloxPlayer.exe";
const STUDIO_DOWNLOAD_URL =
  "https://fwjvihdbbnksqnhcsuse.supabase.co/storage/v1/object/public/Downloads/AdventureBloxStudio.zip";

export default function DownloadPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-10">Downloads</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* AdventureBlox Player */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-6 flex flex-col">
            <div className="w-12 h-12 rounded-lg bg-blue-600/10 flex items-center justify-center mb-4">
              <Gamepad2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              AdventureBlox Player
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-1">
              Launch any AdventureBlox game with our custom branded player. Download once and play instantly.
            </p>
            <a
              href={PLAYER_DOWNLOAD_URL}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Player
            </a>
          </div>

          {/* AdventureBlox Studio */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-6 flex flex-col">
            <div className="w-12 h-12 rounded-lg bg-blue-600/10 flex items-center justify-center mb-4">
              <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              AdventureBlox Studio
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-1">
              Install the AdventureBlox plugin for Roblox Studio. Includes the AdventureBlox tab and tools.
            </p>
            <a
              href={STUDIO_DOWNLOAD_URL}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Studio Setup
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
          Windows only. AdventureBlox Player requires Roblox to be installed.
        </p>
      </main>

      <Footer />
    </div>
  );
}
