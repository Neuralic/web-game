"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

export default function TermsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: July 10, 2026</p>

        <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using AdventureBlox ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">2. Eligibility</h2>
            <p>AdventureBlox is open to users of all ages. Users under 18 must have parental consent.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">3. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. AdventureBlox is not liable for any loss resulting from unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">4. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Harass, bully, or harm other users</li>
              <li>Post inappropriate, offensive, or harmful content</li>
              <li>Attempt to hack, disrupt, or compromise the Platform</li>
              <li>Create multiple accounts to evade bans or restrictions</li>
              <li>Share personal information of other users without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">5. AdventureBux</h2>
            <p>AdventureBux is the virtual currency of AdventureBlox. AdventureBux have no real-world monetary value and cannot be exchanged for real money. AdventureBlox reserves the right to modify, suspend, or terminate the AdventureBux system at any time.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">6. User Content</h2>
            <p>By posting content on AdventureBlox, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on the Platform. You retain ownership of your content but are responsible for ensuring it does not violate any third-party rights.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">7. Intellectual Property</h2>
            <p>All content, features, and functionality on AdventureBlox — including but not limited to text, graphics, logos, and software — are the exclusive property of AdventureBlox Corporation and are protected by applicable intellectual property laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">8. Advertising</h2>
            <p>Users may create and run advertisements on the Platform through our User Ads system. All ads must comply with our Advertising Guidelines and are subject to moderator approval before going live. AdventureBlox reserves the right to reject or remove any ad at its discretion.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">9. Termination</h2>
            <p>AdventureBlox reserves the right to suspend or terminate your account at any time for violations of these Terms of Service or for any other reason at our sole discretion. Upon termination, your right to use the Platform will immediately cease.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">10. Disclaimer of Warranties</h2>
            <p>AdventureBlox is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">11. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, AdventureBlox Corporation shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">12. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms of Service at any time. We will notify users of significant changes. Continued use of the Platform after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">13. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us at <a href="mailto:support@playadventureblox.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@playadventureblox.com</a>.</p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
