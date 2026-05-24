"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Heart, ChevronDown, User, LogOut, Percent, Sun, Moon, Settings, LayoutDashboard, Sparkles } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist-context";
import { getAutocompleteSuggestionsAction } from "@/app/actions/fetch-products";
import { toast } from "sonner";
import { detectUserCountry } from "@/lib/comparator-utils";
import { getCurrentUserAction, logoutAction } from "@/app/actions/auth-actions";

const COUNTRIES = [
  { code: "us", name: "United States", flag: "🇺🇸", symbol: "$" },
  { code: "in", name: "India", flag: "🇮🇳", symbol: "₹" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧", symbol: "£" },
  { code: "ca", name: "Canada", flag: "🇨🇦", symbol: "C$" },
  { code: "au", name: "Australia", flag: "🇦🇺", symbol: "A$" },
  { code: "de", name: "Germany", flag: "🇩🇪", symbol: "€" },
  { code: "fr", name: "France", flag: "🇫🇷", symbol: "€" },
  { code: "jp", name: "Japan", flag: "🇯🇵", symbol: "¥" },
];

function HeaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { watchlistItems, openWatchlist } = useWatchlist();

  const [inputVal, setInputVal] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [theme, setTheme] = useState("light");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const currentGl = searchParams.get("gl") || "us";
  const selectedCountry = COUNTRIES.find((c) => c.code === currentGl) || COUNTRIES[0];

  // Load user profile on mount
  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUserAction();
      setCurrentUser(user);
    }
    loadUser();
  }, []);

  // Auto-detect and set country code, prioritizing user preference if logged in
  useEffect(() => {
    if (currentUser && currentUser.country) {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get("gl") !== currentUser.country) {
        params.set("gl", currentUser.country);
        router.replace(`${pathname}?${params.toString()}`);
      }
    } else if (!searchParams.has("gl")) {
      const detected = detectUserCountry();
      const params = new URLSearchParams(searchParams.toString());
      params.set("gl", detected);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [currentUser, searchParams, pathname, router]);

  // Sync theme status on mount
  useEffect(() => {
    const currentTheme = localStorage.getItem("trendify-theme") || 
      (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setTheme(currentTheme);
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("trendify-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      toast.success("Switched to Dark Mode");
    } else {
      document.documentElement.classList.remove("dark");
      toast.success("Switched to Light Mode");
    }
  };

  // Sync input value with search params on load/change
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setInputVal(q);
  }, [searchParams]);

  // Debounced API autocomplete fetching from Serper
  useEffect(() => {
    if (!inputVal.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const results = await getAutocompleteSuggestionsAction(inputVal);
        setSuggestions(results);
      } catch (err) {
        console.error("Failed to fetch autocomplete:", err);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [inputVal]);

  const handleSearchSubmit = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    // Retain country select during search
    params.set("gl", currentGl);
    router.push(`/?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleCountryChange = (code: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("gl", code);
    router.push(`${pathname}?${params.toString()}`);
    setShowCountryMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit(inputVal);
    }
  };

  const watchlistCount = watchlistItems.length;

  return (
    <header className="sticky top-0 z-40 bg-[#2874f0]/95 backdrop-blur-md dark:bg-zinc-950/90 text-white shadow-md font-sans border-b border-white/10 dark:border-zinc-900/50 transition-all duration-200">
      <div className="mx-auto flex flex-col md:flex-row md:h-14 max-w-7xl justify-between px-4 sm:px-6 lg:px-8 py-2 md:py-0 gap-2 md:gap-4 md:items-center">
        
        {/* Logo Section and Mobile Control Row */}
        <div className="flex items-center justify-between flex-shrink-0">
          {/* Logo */}
          <Link href={`/?gl=${currentGl}`} className="flex flex-col cursor-pointer select-none">
            <span className="text-lg font-bold italic tracking-wide leading-none">
              Trendify
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-semibold italic text-[#ffe500] leading-none mt-0.5">
              Explore <span className="text-white font-bold">Comparator</span>
              <span className="inline-block text-[8px] font-black font-sans leading-none">+</span>
            </span>
          </Link>

          {/* Mobile Buttons Controls Row (Hidden on Desktop) */}
          <div className="flex items-center gap-2 md:hidden">
            {/* User Profile / Login Mobile */}
            <div className="relative">
              {currentUser ? (
                <>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-all flex items-center justify-center cursor-pointer bg-transparent border-0"
                    title="User Menu"
                  >
                    <User className="h-5 w-5 text-[#ffe500]" />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-md border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 text-black dark:text-white z-50">
                      <div className="border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Logged in as</p>
                        <p className="text-xs font-semibold text-[#2874f0] truncate">{currentUser.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          router.push("/profile");
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer border-0 bg-transparent"
                      >
                        <LayoutDashboard className="mr-3 h-4 w-4 text-zinc-500" />
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          router.push("/onboarding");
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer border-0 bg-transparent"
                      >
                        <Settings className="mr-3 h-4 w-4 text-zinc-500" />
                        Preferences
                      </button>
                      <button
                        onClick={() => {
                          router.push(`/watchlist?gl=${currentGl}`);
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer border-0 bg-transparent"
                      >
                        <Heart className="mr-3 h-4 w-4 text-zinc-500" />
                        Watchlist
                      </button>
                      <button
                        onClick={async () => {
                          setShowUserMenu(false);
                          const res = await logoutAction();
                          if (res.success) {
                            setCurrentUser(null);
                            toast.success("Successfully logged out");
                            router.push("/");
                            router.refresh();
                          }
                        }}
                        className="flex w-full items-center border-t border-zinc-100 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:border-zinc-800 dark:hover:bg-red-950/20 cursor-pointer border-0 bg-transparent"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => router.push("/auth")}
                  className="p-2 hover:bg-white/10 rounded-lg text-white transition-all flex items-center justify-center cursor-pointer bg-transparent border-0"
                  title="Login"
                >
                  <User className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* AI Assistant Mobile */}
            <button
              onClick={() => router.push(`/ai-assistant?gl=${currentGl}`)}
              className="p-2 hover:bg-white/10 rounded-lg text-white transition-all border-0 bg-transparent cursor-pointer"
              title="AI Assistant"
            >
              <Sparkles className="h-5 w-5 text-[#ffe500]" />
            </button>

            {/* Watchlist Mobile */}
            <button
              onClick={() => router.push(`/watchlist?gl=${currentGl}`)}
              className="relative p-2 hover:bg-white/10 rounded-lg text-white transition-all"
            >
              <Heart className="h-5 w-5 fill-none text-white" />
              {watchlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#ffe500] text-[9px] font-bold text-black border border-[#2874f0]">
                  {watchlistCount}
                </span>
              )}
            </button>

            {/* Theme Selector Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-white/10 rounded-lg text-white transition-all"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Country Selector Selector Mobile (Mini Flag Badge) */}
            <button
              onClick={() => setShowCountryMenu(!showCountryMenu)}
              className="px-2 py-1 bg-white/10 border border-white/10 hover:bg-white/20 rounded-lg flex items-center gap-1 text-sm font-semibold transition-all"
              title="Select Market Country"
            >
              <span className="text-base">{selectedCountry.flag}</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-200" />
            </button>
          </div>
        </div>

        {/* Search Bar (Full width on mobile, max-width on desktop) */}
        <div className="relative flex flex-1 w-full max-w-full md:max-w-xl pb-1 md:pb-0">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Compare prices for mobiles, laptops, headphones..."
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
              className="w-full rounded-lg bg-white dark:bg-zinc-900 py-1.5 md:py-2 pl-4 pr-10 text-sm text-black dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 shadow-sm border border-transparent dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#ffe500]/50 transition-all duration-200"
            />
            <button
              onClick={() => handleSearchSubmit(inputVal)}
              className="absolute right-0 top-0 flex h-full items-center px-3 text-[#2874f0] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-r-lg transition-colors cursor-pointer"
            >
              <Search className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              {suggestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputVal(item);
                    handleSearchSubmit(item);
                  }}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <Search className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Items (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-3 sm:gap-5 md:gap-7">
          
          {/* Country Selector Dropdown Desktop */}
          <div className="relative">
            <button
              onClick={() => setShowCountryMenu(!showCountryMenu)}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-sm font-semibold transition-all cursor-pointer border border-white/10 backdrop-blur-xs"
              title="Select Market Country"
            >
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="uppercase text-xs tracking-wider font-bold hidden xs:inline">{selectedCountry.code}</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showCountryMenu ? "rotate-180" : ""}`} />
            </button>

            {showCountryMenu && (
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md border border-zinc-200 bg-white py-1 shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 text-black dark:text-white z-50 animate-in fade-in slide-in-from-top-1">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleCountryChange(c.code)}
                    className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                      currentGl === c.code ? "bg-zinc-50 dark:bg-zinc-900 font-bold" : ""
                    }`}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono font-bold">
                      {c.symbol}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button Desktop */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white border border-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>

          {/* User Account / Login Button Desktop */}
          <div className="relative">
            {currentUser ? (
              <>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-[#2874f0] dark:bg-zinc-900 dark:text-zinc-100 border border-transparent dark:border-zinc-800 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-[1.02] active:scale-98 cursor-pointer max-w-[150px]"
                >
                  <span className="truncate text-xs font-bold font-sans">
                    {currentUser.email.split("@")[0]}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-205 ${showUserMenu ? "rotate-180" : ""}`} />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-md border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 text-black dark:text-white z-50">
                    <div className="border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Logged in as</p>
                      <p className="text-xs font-semibold text-[#2874f0] truncate">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        router.push("/profile");
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <LayoutDashboard className="mr-3 h-4 w-4 text-zinc-500" />
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        router.push("/onboarding");
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Settings className="mr-3 h-4 w-4 text-zinc-500" />
                      Preferences
                    </button>
                    <button
                      onClick={() => {
                        router.push(`/watchlist?gl=${currentGl}`);
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Heart className="mr-3 h-4 w-4 text-zinc-500" />
                      Watchlist
                    </button>
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        const res = await logoutAction();
                        if (res.success) {
                          setCurrentUser(null);
                          toast.success("Successfully logged out");
                          router.push("/");
                          router.refresh();
                        }
                      }}
                      className="flex w-full items-center border-t border-zinc-100 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:border-zinc-800 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-sm font-bold text-[#2874f0] dark:bg-zinc-900 dark:text-zinc-100 border border-transparent dark:border-zinc-800 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-[1.02] active:scale-98 cursor-pointer"
              >
                Login
              </button>
            )}
          </div>

          {/* AI Assistant Icon Desktop */}
          <button
            onClick={() => router.push(`/ai-assistant?gl=${currentGl}`)}
            className="relative flex items-center gap-2 text-sm font-bold transition-all hover:text-zinc-150 cursor-pointer hover:scale-105 active:scale-95"
            title="AI Assistant"
          >
            <Sparkles className="h-5 w-5 text-[#ffe500]" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>

          {/* Watchlist Icon Desktop */}
          <button
            onClick={() => router.push(`/watchlist?gl=${currentGl}`)}
            className="relative flex items-center gap-2 text-sm font-bold transition-all hover:text-zinc-100 cursor-pointer"
          >
            <div className="relative">
              <Heart className="h-5 w-5 fill-none text-white" />
              {watchlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ffe500] text-[10px] font-bold text-black border-2 border-[#2874f0] animate-in zoom-in">
                  {watchlistCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Watchlist</span>
          </button>
        </div>
      </div>

      {/* Floating Country Menu for Mobile Dropdown */}
      {showCountryMenu && (
        <div className="md:hidden absolute right-4 mt-1 w-48 rounded-md border border-zinc-200 bg-white py-1 shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 text-black dark:text-white z-50 animate-in fade-in slide-in-from-top-1">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleCountryChange(c.code)}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                currentGl === c.code ? "bg-zinc-50 dark:bg-zinc-900 font-bold" : ""
              }`}
            >
              <span className="text-base">{c.flag}</span>
              <span className="truncate text-xs">{c.name}</span>
              <span className="ml-auto text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0">
                {c.symbol}
              </span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-40 bg-[#2874f0] text-white shadow-md h-14">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-bold italic">Trendify</div>
          <div className="h-5 w-5 bg-white/20 animate-pulse rounded"></div>
        </div>
      </header>
    }>
      <HeaderContent />
    </Suspense>
  );
}
