"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ProtectedRoute from "../components/ProtectedRoute";

const MembershipPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showStickyHeader, setShowStickyHeader] = useState(false);

    // Track scroll for sticky header
    useEffect(() => {
        const handleScroll = () => {
            setShowStickyHeader(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Membership tiers - matching AdventureBux pricing
    const membershipTiers = [
        {
            id: 1,
            name: "2,000 AdventureBux",
            price: 0.99,
            currency: 2000,
        },
        {
            id: 2,
            name: "5,000 AdventureBux",
            price: 4.99,
            currency: 5000,
        },
        {
            id: 3,
            name: "11,000 AdventureBux",
            price: 11.99,
            currency: 11000,
        },
        {
            id: 4,
            name: "24,000 AdventureBux",
            price: 19.99,
            currency: 24000,
        },
    ];

    // Membership game placeholders with gradient colors
    const membershipGames = [
        { id: 1, name: "Racing Adventure", gradient: "from-orange-500 to-red-600", icon: "🏎️" },
        { id: 2, name: "Night City", gradient: "from-purple-600 to-pink-600", icon: "🌃" },
        { id: 3, name: "Forest Quest", gradient: "from-green-500 to-emerald-600", icon: "🌲" },
        { id: 4, name: "Sky Jump", gradient: "from-cyan-400 to-blue-500", icon: "☁️" },
        { id: 5, name: "Beach Resort", gradient: "from-yellow-400 to-orange-500", icon: "🏖️" },
        { id: 6, name: "City Life", gradient: "from-rose-400 to-pink-500", icon: "🏙️" },
        { id: 7, name: "Battle Arena", gradient: "from-slate-600 to-gray-700", icon: "⚔️" },
    ];

    // Currency icon component using your assets
    const CurrencyIcon = ({ size = 80 }: { size?: number }) => (
        <div className="relative" style={{ width: size, height: size }}>
            <Image
                src="/icons/currency_black.png"
                alt="AdventureBux"
                width={size}
                height={size}
                className="block dark:hidden"
            />
            <Image
                src="/icons/currency_white.png"
                alt="AdventureBux"
                width={size}
                height={size}
                className="hidden dark:block"
            />
        </div>
    );

    // Membership icon for hero - using your coin asset
    const MembershipHeroIcon = () => (
        <div className="w-24 h-24 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-xl">
            <div className="relative w-14 h-14">
                <Image
                    src="/icons/currency_white.png"
                    alt="AdventureBux"
                    width={56}
                    height={56}
                    className="block dark:hidden"
                />
                <Image
                    src="/icons/currency_black.png"
                    alt="AdventureBux"
                    width={56}
                    height={56}
                    className="hidden dark:block"
                />
            </div>
        </div>
    );

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
                <Header
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setSidebarOpen={setSidebarOpen}
                />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Sticky Membership Header */}
                <div
                    className={`fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ${
                        showStickyHeader ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
                    }`}
                >
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">AdventureBlox Membership</span>
                        <button className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-semibold px-6 py-2 rounded-lg transition-colors text-sm">
                            Get Membership
                        </button>
                    </div>
                </div>

                <main className="flex-1">
                    {/* Hero Section - 3D Geometric Style */}
                    <section className="relative overflow-hidden">
                        {/* Geometric Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800">
                            {/* 3D Geometric shapes */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice">
                                <defs>
                                    <linearGradient id="shape1" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#E5E7EB" />
                                        <stop offset="100%" stopColor="#D1D5DB" />
                                    </linearGradient>
                                    <linearGradient id="shape2" x1="0%" y1="100%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#F3F4F6" />
                                        <stop offset="100%" stopColor="#E5E7EB" />
                                    </linearGradient>
                                    <linearGradient id="shape1Dark" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#374151" />
                                        <stop offset="100%" stopColor="#1F2937" />
                                    </linearGradient>
                                    <linearGradient id="shape2Dark" x1="0%" y1="100%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#4B5563" />
                                        <stop offset="100%" stopColor="#374151" />
                                    </linearGradient>
                                </defs>
                                {/* Large geometric panels */}
                                <polygon points="0,0 400,0 350,250 0,200" className="fill-gray-200 dark:fill-gray-700" />
                                <polygon points="400,0 800,0 750,200 350,250" className="fill-gray-300 dark:fill-gray-600" />
                                <polygon points="800,0 1200,0 1200,300 750,200" className="fill-gray-200 dark:fill-gray-700" />
                                <polygon points="0,200 350,250 300,500 0,500" className="fill-gray-300 dark:fill-gray-600" />
                                <polygon points="350,250 750,200 700,500 300,500" className="fill-gray-100 dark:fill-gray-800" />
                                <polygon points="750,200 1200,300 1200,500 700,500" className="fill-gray-200 dark:fill-gray-700" />
                            </svg>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 py-20 md:py-28 px-4">
                            <div className="max-w-2xl mx-auto text-center">
                                <div className="mb-8 inline-block">
                                    <MembershipHeroIcon />
                                </div>

                                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
                                    AdventureBlox Membership
                                </h1>

                                <button className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-semibold px-10 py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105">
                                    Get Membership
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* AdventureBux Monthly */}
                    <section className="bg-gray-50 dark:bg-gray-950 py-16 px-4">
                        <div className="max-w-5xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    AdventureBux every month
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Receive AdventureBux monthly on your subscription renewal date
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                                {membershipTiers.map((tier) => (
                                    <div key={tier.id} className="text-center">
                                        <div className="mb-4 inline-block">
                                            <CurrencyIcon size={80} />
                                        </div>

                                        <div className="text-3xl font-bold mb-1">
                                            <span className="text-gray-900 dark:text-white">
                                                {tier.currency.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            US${tier.price.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Membership Benefits */}
                    <section className="bg-white dark:bg-gray-900 py-16 px-4">
                        <div className="max-w-5xl mx-auto">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    Membership benefits within experiences
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Get access to{" "}
                                    <span className="text-blue-600 dark:text-blue-400">Member-only levels, items, boosters</span>
                                    , and more!
                                </p>
                            </div>

                            {/* Top row - 3 larger cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                {membershipGames.slice(0, 3).map((game) => (
                                    <Link
                                        key={game.id}
                                        href="/games"
                                        className={`relative aspect-video rounded-xl overflow-hidden group cursor-pointer bg-gradient-to-br ${game.gradient} shadow-md hover:shadow-xl transition-all duration-300`}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                                                {game.icon}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                                            <span className="text-white font-medium text-sm">{game.name}</span>
                                        </div>
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </Link>
                                ))}
                            </div>

                            {/* Bottom row - 4 smaller cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                                {membershipGames.slice(3, 7).map((game) => (
                                    <Link
                                        key={game.id}
                                        href="/games"
                                        className={`relative aspect-square rounded-xl overflow-hidden group cursor-pointer bg-gradient-to-br ${game.gradient} shadow-md hover:shadow-xl transition-all duration-300`}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                                                {game.icon}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                            <span className="text-white font-medium text-xs">{game.name}</span>
                                        </div>
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </Link>
                                ))}
                            </div>

                            <div className="text-center">
                                <Link
                                    href="/games"
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                                >
                                    Explore popular among Membership experiences
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* More Benefits */}
                    <section className="bg-gray-50 dark:bg-gray-950 py-16 px-4">
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    ...and much more
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* More AdventureBux */}
                                <div className="text-center">
                                    <div className="mb-6 inline-block relative">
                                        {/* Coin with +10% badge */}
                                        <div className="relative">
                                            <CurrencyIcon size={96} />
                                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                                                +10%
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        More AdventureBux
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Get 10% more when you buy AdventureBux
                                    </p>
                                </div>

                                {/* Trade */}
                                <div className="text-center">
                                    <div className="mb-6 inline-block">
                                        {/* Two blue arrows for trade */}
                                        <svg width="96" height="96" viewBox="0 0 100 100" fill="none">
                                            <defs>
                                                <linearGradient id="tradeBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#60A5FA" />
                                                    <stop offset="100%" stopColor="#2563EB" />
                                                </linearGradient>
                                            </defs>
                                            {/* Left arrow */}
                                            <path
                                                d="M10 35 L40 35 L40 25 L55 40 L40 55 L40 45 L10 45 Z"
                                                fill="url(#tradeBlue)"
                                            />
                                            {/* Right arrow */}
                                            <path
                                                d="M90 65 L60 65 L60 75 L45 60 L60 45 L60 55 L90 55 Z"
                                                fill="url(#tradeBlue)"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Trade
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Unlock the ability to trade items
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Pricing */}
                    <section className="bg-white dark:bg-gray-900 py-16 px-4">
                        <div className="max-w-5xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Your Membership
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                                {membershipTiers.map((tier, index) => (
                                    <div
                                        key={tier.id}
                                        className={`relative bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 text-center transition-all hover:shadow-lg ${
                                            index === 3 ? "ring-2 ring-amber-400 dark:ring-amber-500" : ""
                                        }`}
                                    >
                                        {/* Best Value badge for largest tier */}
                                        {index === 3 && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 dark:bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                                                Best Value
                                            </div>
                                        )}

                                        <div className="mb-4 inline-block">
                                            <CurrencyIcon size={48} />
                                        </div>

                                        <div className="mb-4">
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                                {tier.currency.toLocaleString()}
                                            </div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                US${tier.price.toFixed(2)}
                                            </div>
                                        </div>

                                        <button className="w-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-semibold py-2.5 rounded-lg transition-all hover:scale-[1.02] text-sm">
                                            Get Membership
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Benefits summary with avatar illustration placeholder */}
                            <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                                        <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3.5 h-3.5 text-white dark:text-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm">Access Membership benefits within experiences</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                                        <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3.5 h-3.5 text-white dark:text-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm">Get 10% more AdventureBux when you buy AdventureBux</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                                        <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3.5 h-3.5 text-white dark:text-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm">Unlock the ability to trade items</span>
                                    </div>
                                </div>

                                {/* Avatar placeholder area */}
                                <div className="hidden md:flex items-end justify-center gap-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={`rounded-full bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 ${
                                                i === 2 ? "w-16 h-24" : i === 3 ? "w-14 h-20" : "w-12 h-16"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Disclaimer */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-200 dark:border-gray-700 pt-6">
                                <p>
                                    Get AdventureBux to purchase upgrades for your avatar or buy special abilities in games. If you are under 18 make sure you have the permission of your parent or legal guardian before making a purchase. Making a purchase without permission may result in your account being deleted. By clicking "Submit Order" (1) you authorize us to charge your account every month until you cancel the subscription, and (2) you represent that you understand and agree to the{" "}
                                    <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        Terms of Use
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        Privacy Policy
                                    </Link>
                                    . You can cancel at any time by clicking "Cancel subscription" on the{" "}
                                    <Link href="/settings" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        billing tab
                                    </Link>{" "}
                                    of the setting page. If you cancel, you will still be charged for the current billing period.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </ProtectedRoute>
    );
};

export default MembershipPage;
