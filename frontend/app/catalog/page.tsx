"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, X } from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

interface CatalogItem {
  id: number;
  title: string;
  creator: string;
  image: string;
  favorited: boolean;
  category: string;
  isPet?: boolean;
}

const CatalogPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [tagScrollPosition, setTagScrollPosition] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  const [creatorFilter, setCreatorFilter] = useState("All Creators");
  const [creatorNameInput, setCreatorNameInput] = useState("");
  const [sortBy, setSortBy] = useState("Relevance");
  const [unavailableItemsFilter, setUnavailableItemsFilter] = useState(
    "Hide Unavailable Items",
  );

  // Cart count and items
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<CatalogItem[]>([]);

  // Tag scrolling functions
  const scrollTags = (direction: "left" | "right") => {
    const container = document.getElementById("tags-container");
    if (container) {
      const scrollAmount = 200;
      const newPosition =
        direction === "left"
          ? Math.max(0, tagScrollPosition - scrollAmount)
          : tagScrollPosition + scrollAmount;

      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setTagScrollPosition(newPosition);
    }
  };

  // Tag selection handlers
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([tag, ...selectedTags]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  // Get tags to display (selected tags first, then unselected)
  const getDisplayTags = () => {
    const tags: Array<{
      tag: string;
      isSelected: boolean;
      subTags?: string[];
    }> = [];

    // Add selected tags first with their sub-tags
    selectedTags.forEach((tag) => {
      tags.push({ tag, isSelected: true });
      if (tagData[tag]) {
        tagData[tag].forEach((subTag) => {
          tags.push({ tag: subTag, isSelected: false });
        });
      }
    });

    // Add unselected tags
    popularTags.forEach((tag) => {
      if (!selectedTags.includes(tag)) {
        tags.push({ tag, isSelected: false });
      }
    });

    return tags;
  };

  // Popular tags with sub-tags
  const tagData: { [key: string]: string[] } = {
    beard: [
      "white",
      "stubble",
      "brown",
      "black",
      "santa",
      "long",
      "grey",
      "blonde",
      "chin",
      "face",
      "wizard",
    ],
    dreads: ["white", "black", "brown", "blonde", "long", "short", "rainbow"],
    steven: ["universe", "face", "gem", "shield"],
    emotes: ["dance", "wave", "laugh", "cry", "point", "sit"],
    face: ["happy", "sad", "angry", "smile", "frown", "eyes"],
    monkey: ["brown", "banana", "tail", "king"],
    fedora: ["black", "brown", "white", "red", "blue"],
    scarf: ["red", "blue", "winter", "striped", "long"],
    beanie: ["black", "red", "blue", "winter", "warm"],
    sunglasses: ["black", "aviator", "round", "cool"],
    aura: ["blue", "red", "purple", "golden", "rainbow"],
    shades: ["black", "cool", "dark", "aviator"],
    monster: ["scary", "green", "horns", "teeth"],
    eyeless: ["horror", "creepy", "dark"],
    keffiyeh: ["traditional", "white", "black", "red"],
    afro: ["black", "brown", "rainbow", "big"],
    fang: ["vampire", "white", "sharp"],
    cross: ["gold", "silver", "necklace"],
    initial: ["gold", "silver", "letter"],
    gift: ["box", "present", "wrapped"],
    mullet: ["blonde", "brown", "80s"],
    pose: ["standing", "sitting", "dancing"],
    axolotl: ["pink", "blue", "cute"],
    halo: ["gold", "angel", "holy"],
    ushanka: ["russian", "winter", "fur"],
    balaclava: ["black", "tactical", "mask"],
    animatronic: ["robot", "metal", "fnaf"],
    necklace: ["gold", "silver", "chain"],
    eyepatch: ["pirate", "black", "leather"],
    blindfold: ["black", "white", "cloth"],
    mouthless: ["creepy", "horror"],
    cheeks: ["rosy", "blushing", "red"],
    mustache: ["black", "brown", "curly", "handlebar"],
    pet: ["dog", "cat", "bird", "dragon", "companion", "animal", "cute"],
    dragon: ["mini", "fire", "ice", "mythical", "wings", "scales"],
    companion: ["pet", "friend", "buddy", "animal", "following"],
    dog: ["puppy", "golden", "retriever", "wolf", "space", "cute"],
    cat: ["black", "ninja", "feline", "kitten", "companion"],
    unicorn: ["mythical", "rainbow", "horn", "magical", "fantasy"],
    phoenix: ["fire", "bird", "legendary", "ice", "mythical"],
    panda: ["baby", "cute", "bear", "bamboo", "black", "white"],
  };

  const popularTags = Object.keys(tagData);

  // Categories
  const categories = [
    { id: "all", label: "All" },
    { id: "body", label: "Body" },
    { id: "clothing", label: "Clothing" },
    { id: "accessories", label: "Accessories" },
    { id: "pets", label: "Pets" },
    { id: "animations", label: "Animations" },
  ];

  // Sort options
  const sortOptions = [
    "Relevance",
    "Most Favorited",
    "Recently Published",
    "Most Recent",
  ];

  // Unavailable items options
  const unavailableOptions = [
    "Show All Items",
    "Hide Unavailable Items",
    "Show Only Unavailable Items",
  ];

  // Dummy catalog items
  const catalogItems = [
    {
      id: 1,
      title: "!showspeed",
      creator: "___sam.antha",
      image: "https://robohash.org/catalog1?set=set4",
      favorited: false,
      category: "Clothing",
    },
    {
      id: 2,
      title: "adidas Community Animation Pack",
      creator: "Roblox",
      image: "https://robohash.org/catalog2?set=set4",
      favorited: false,
      category: "Animations",
    },
    {
      id: 3,
      title: "Teen Gojo",
      creator: "Realistic Bundles",
      image: "https://robohash.org/catalog3?set=set4",
      favorited: false,
      category: "Body",
    },
    {
      id: 4,
      title: "Black Messy Wolfcut w/ Bandage",
      creator: "smellyFartUGC",
      image: "https://robohash.org/catalog4?set=set4",
      favorited: false,
      category: "Accessories",
    },
    {
      id: 5,
      title: "Sung Jin Woo",
      creator: "LORD Store",
      image: "https://robohash.org/catalog5?set=set4",
      favorited: false,
      category: "Body",
    },
    {
      id: 6,
      title: "Doakes (Dexter)",
      creator: "Face Station",
      image: "https://robohash.org/catalog6?set=set4",
      favorited: false,
      category: "Body",
    },
    {
      id: 7,
      title: "Cute Toothless Dragon Suit",
      creator: "welcome to forever",
      image: "https://robohash.org/catalog7?set=set4",
      favorited: false,
      category: "Clothing",
    },
    {
      id: 8,
      title: "Demonic Black Hair w/ Fiery Red Horns & Rage Face",
      creator: "GarlCON",
      image: "https://robohash.org/catalog8?set=set4",
      favorited: false,
      category: "Accessories",
    },
    {
      id: 9,
      title: "Golden Retriever Puppy",
      creator: "Pet Paradise",
      image: "https://robohash.org/pet1?set=set4",
      favorited: false,
      category: "Pets",
    },
    {
      id: 10,
      title: "Mini Dragon Companion",
      creator: "Mythical Pets",
      image: "https://robohash.org/pet2?set=set4",
      favorited: false,
      category: "Pets",
    },
    {
      id: 11,
      title: "Black Cat",
      creator: "Pet Paradise",
      image: "https://robohash.org/pet3?set=set4",
      favorited: false,
      category: "Pets",
    },
    {
      id: 12,
      title: "Phoenix Companion",
      creator: "Legendary Pets",
      image: "https://robohash.org/pet4?set=set4",
      favorited: false,
      category: "Pets",
    },
    {
      id: 13,
      title: "Blue Parrot",
      creator: "Pet Paradise",
      image: "https://robohash.org/pet5?set=set4",
      favorited: false,
      category: "Pets",
    },
    {
      id: 14,
      title: "White Wolf",
      creator: "Wild Companions",
      image: "https://robohash.org/pet6?set=set4",
      favorited: false,
      category: "Pets",
    },
    {
      id: 15,
      title: "Axolotl Friend",
      creator: "Aquatic Pets",
      image: "https://robohash.org/pet7?set=set4",
      favorited: false,
      category: "Pets",
    },
    {
      id: 16,
      title: "Unicorn Companion",
      creator: "Mythical Pets",
      image: "https://robohash.org/pet8?set=set4",
      favorited: false,
      category: "Pets",
    },
    {
      id: 17,
      title: "Baby Panda",
      creator: "Cute Critters",
      image: "https://robohash.org/pet9?set=set4",
      favorited: false,
      category: "Pets",
    },
    {
      id: 18,
      title: "Cool Sunglasses",
      creator: "Accessories Pro",
      image: "https://robohash.org/catalog13?set=set4",
      favorited: false,
      category: "Accessories",
    },
    {
      id: 19,
      title: "Winter Scarf",
      creator: "Fashion Items",
      image: "https://robohash.org/catalog14?set=set4",
      favorited: false,
      category: "Accessories",
    },
    {
      id: 20,
      title: "Beanie Hat",
      creator: "Hats Collection",
      image: "https://robohash.org/catalog15?set=set4",
      favorited: false,
      category: "Accessories",
    },
  ];

  const CatalogItemCard = ({ item }: { item: CatalogItem }) => (
    <Link href={`/catalog/${item.id}`} className="block group">
      <div className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="pt-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {item.title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            By <span className="hover:underline">{item.creator}</span>
          </p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 w-full">
        {/* Top Bar - Marketplace Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-3">
            {/* Title + Search + Dropdown + Buy Button Row */}
            <div className="flex items-center justify-between gap-3 mb-3">
              {/* Left Side: Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                Catalog
              </h1>

              {/* Right Side: Search + Dropdown + Buy Button + Cart */}
              <div className="flex items-center gap-2 flex-1 justify-end">
                {/* Search Bar */}
                <div className="w-full max-w-md relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded pl-8 pr-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Category Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <option>All</option>
                  <option>Body</option>
                  <option>Clothing</option>
                  <option>Accessories</option>
                  <option>Pets</option>
                  <option>Animations</option>
                </select>

                {/* Buy AdventureBux Button */}
                <Link
                  href="/buy-adventurebux"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded text-sm whitespace-nowrap transition-colors"
                >
                  Buy AdventureBux
                </Link>

                {/* Cart Icon */}
                <div className="relative">
                  <button
                    onClick={() => setShowCartModal(!showCartModal)}
                    className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  >
                    <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>

                  {/* Cart Dropdown - positioned relative to cart button */}
                  {showCartModal && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCartModal(false)}
                      ></div>

                      {/* Cart Modal */}
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              Shopping cart ({cartCount})
                            </h3>
                            <button
                              onClick={() => setShowCartModal(false)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>

                        {/* Cart Items */}
                        <div className="max-h-96 overflow-y-auto">
                          {cartItems.length === 0 ? (
                            <div className="p-8 text-center">
                              <ShoppingCart className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                              <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Your cart is empty
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 space-y-3">
                              {cartItems.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex-shrink-0">
                                    <Image
                                      src={item.image}
                                      alt={item.title}
                                      width={64}
                                      height={64}
                                      className="w-full h-full object-cover rounded"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                      {item.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      By {item.creator}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                      {item.creator}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setCartItems(
                                        cartItems.filter((_, i) => i !== index),
                                      );
                                      setCartCount(Math.max(0, cartCount - 1));
                                    }}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                  >
                                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Total: {cartItems.length} items
                            </span>
                            <div className="flex items-center gap-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                              <span className="text-gray-700 dark:text-gray-300">
                                ◈
                              </span>
                              <span>0</span>
                            </div>
                          </div>

                          <button
                            disabled={cartItems.length === 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed"
                          >
                            Buy
                          </button>

                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                            Your balance after this transaction will be{" "}
                            <span className="font-semibold">◈ 0</span>
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Buttons Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
              >
                {categoryFilter}
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <button
                onClick={() => setShowCreatorModal(true)}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
              >
                {creatorFilter}
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <button
                onClick={() => setShowSortModal(true)}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
              >
                Sort by {sortBy}
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <button
                onClick={() => setShowUnavailableModal(true)}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
              >
                {unavailableItemsFilter}
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Popular Tags */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            {/* Left Arrow */}
            <button
              onClick={() => scrollTags("left")}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
              aria-label="Scroll tags left"
            >
              <svg
                className="w-4 h-4 text-gray-600 dark:text-gray-400 rotate-180"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Tags Container */}
            <div
              id="tags-container"
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
            >
              {getDisplayTags().map((item, index) =>
                item.isSelected ? (
                  // Selected tag with X button
                  <button
                    key={`${item.tag}-${index}`}
                    className="px-4 py-1.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 text-sm font-semibold rounded-full whitespace-nowrap transition-colors flex-shrink-0 flex items-center gap-2"
                  >
                    <span>{item.tag}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTag(item.tag);
                      }}
                      className="hover:bg-gray-700 dark:hover:bg-gray-300 rounded-full p-0.5 transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </button>
                ) : (
                  // Unselected tag
                  <button
                    key={`${item.tag}-${index}`}
                    onClick={() => toggleTag(item.tag)}
                    className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0"
                  >
                    {item.tag}
                  </button>
                ),
              )}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scrollTags("right")}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
              aria-label="Scroll tags right"
            >
              <svg
                className="w-4 h-4 text-gray-600 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Catalog Items Grid */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {catalogItems.map((item) => (
              <CatalogItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Load More Button */}
          <div className="flex justify-center mt-8 pb-8">
            <button className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
              Load More
            </button>
          </div>
        </div>
      </main>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Category
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={categoryFilter === cat.label}
                    onChange={() => setCategoryFilter(cat.label)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {cat.label}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowCategoryModal(false)}
              className="w-full mt-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Creator Modal */}
      {showCreatorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Creator
              </h3>
              <button
                onClick={() => setShowCreatorModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                <input
                  type="radio"
                  name="creator"
                  checked={creatorFilter === "All Creators"}
                  onChange={() => setCreatorFilter("All Creators")}
                  className="w-5 h-5"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  All Creators
                </span>
              </label>
              <div>
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                  <input
                    type="radio"
                    name="creator"
                    checked={creatorFilter !== "All Creators"}
                    onChange={() => setCreatorFilter("Specific Creator")}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Specific Creator
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Creator Name"
                  value={creatorNameInput}
                  onChange={(e) => setCreatorNameInput(e.target.value)}
                  disabled={creatorFilter === "All Creators"}
                  className="w-full mt-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <button
              onClick={() => setShowCreatorModal(false)}
              className="w-full mt-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Sort By Modal */}
      {showSortModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Sort By
              </h3>
              <button
                onClick={() => setShowSortModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              {sortOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <input
                    type="radio"
                    name="sort"
                    checked={sortBy === option}
                    onChange={() => setSortBy(option)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {option}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowSortModal(false)}
              className="w-full mt-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Unavailable Items Modal */}
      {showUnavailableModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Unavailable Items
              </h3>
              <button
                onClick={() => setShowUnavailableModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              {unavailableOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                >
                  <input
                    type="radio"
                    name="unavailable"
                    checked={unavailableItemsFilter === option}
                    onChange={() => setUnavailableItemsFilter(option)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {option}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowUnavailableModal(false)}
              className="w-full mt-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CatalogPage;
