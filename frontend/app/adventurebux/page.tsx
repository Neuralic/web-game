"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ProtectedRoute from "../components/ProtectedRoute";
import UserAdBanner from "../components/UserAdBanner";

const AdventureBuxPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Package data - simplified
  const packages = [
    {
      id: 1,
      amount: 24000,
      price: "US$19.99",
    },
    {
      id: 2,
      amount: 11000,
      price: "US$11.99",
    },
    {
      id: 3,
      amount: 5000,
      price: "US$4.99",
    },
    {
      id: 4,
      amount: 2000,
      price: "US$0.99",
    },
  ];

  const membershipPerks = {
    title: "Get AdventureBlox Membership",
    monthlyBux: "1000 AdventureBux each month",
    bonusPercent: "Up to 35% more on AdventureBux purchases",
    trading: "Trade, resell and publish avatar items",
    price: "US$4.99/month",
  };

  const faqs = [
    {
      question: "What are AdventureBux?",
      answer:
        "AdventureBux is the virtual currency used on AdventureBlox. You can use AdventureBux to purchase upgrades for your avatar, special abilities in games, and other virtual items.",
    },
    {
      question: "Where are my AdventureBux?",
      answer:
        "Your AdventureBux balance is displayed in the top right corner of the website when you're logged in. You can also check your balance on your profile page.",
    },
    {
      question: "Do AdventureBux expire?",
      answer:
        "No, AdventureBux do not expire. Once purchased, they remain in your account until you spend them.",
    },
    {
      question: "How to redeem your gift card?",
      answer:
        "To redeem a gift card, go to the Gift Cards page, enter your code, and click Redeem. The AdventureBux will be added to your account immediately.",
    },
  ];

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
          <div className="flex justify-center mb-6">
            <UserAdBanner format="728x90" />
          </div>
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
              Buy AdventureBux
            </h1>
          </div>

          {/* Packages Section */}
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Select a package
            </h3>

            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Currency Icon */}
                      <div className="w-8 h-8 relative flex-shrink-0">
                        <Image
                          src="/icons/currency_black.png"
                          alt="AdventureBux"
                          width={32}
                          height={32}
                          className="block dark:hidden"
                        />
                        <Image
                          src="/icons/currency_white.png"
                          alt="AdventureBux"
                          width={32}
                          height={32}
                          className="hidden dark:block"
                        />
                      </div>

                      {/* Amount */}
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {pkg.amount.toLocaleString()}
                      </span>
                    </div>

                    {/* Buy Button */}
                    <button className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold px-6 py-2 rounded-lg transition-colors">
                      {pkg.price}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Membership Section */}
          <section className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Enjoy exclusive perks
            </h3>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span className="text-2xl">👑</span>
                    {membershipPerks.title}
                  </h4>

                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-5 h-5 relative flex-shrink-0 mt-0.5">
                        <Image
                          src="/icons/currency_black.png"
                          alt=""
                          width={20}
                          height={20}
                          className="block dark:hidden"
                        />
                        <Image
                          src="/icons/currency_white.png"
                          alt=""
                          width={20}
                          height={20}
                          className="hidden dark:block"
                        />
                      </div>
                      <span>{membershipPerks.monthlyBux}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-lg">💰</span>
                      <span>{membershipPerks.bonusPercent}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-lg">🔄</span>
                      <span>{membershipPerks.trading}</span>
                    </li>
                  </ul>
                </div>

                {/* Subscribe Button */}
                <button className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold px-6 py-2 rounded-lg transition-colors whitespace-nowrap">
                  {membershipPerks.price}
                </button>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              FAQ
            </h3>

            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                        expandedFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedFaq === index && (
                    <div className="px-6 pb-4 text-sm text-gray-700 dark:text-gray-300">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Disclaimer */}
          <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
            <p>
              When you buy AdventureBux you receive only a limited,
              non-refundable, non-transferable, revocable license to use
              AdventureBux, which has no value in real currency. By selecting
              the Membership subscription package, (1) you agree that you are over
              18 and that AdventureBlox is charging your account every month
              until you cancel the subscription, and (2) you are aware that
              you can cancel the subscription by selecting "Cancel
              subscription" on the billing tab of the settings page. If you
              cancel, you will still be charged for the current billing period.
              See{" "}
              <Link
                href="/terms"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Terms of Use
              </Link>{" "}
              for other limitations.
            </p>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default AdventureBuxPage;
