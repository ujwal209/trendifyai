"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Sparkles, Globe2, ShoppingBag, Bookmark, ArrowRight, ArrowLeft, Check, Loader2,
  Smartphone, Laptop, Headphones, Shirt, Plug, BookOpen
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { getCurrentUserAction, updateOnboardingAction } from "@/app/actions/auth-actions";

interface CountryOption {
  code: string;
  name: string;
  currency: string;
}

const COUNTRIES: CountryOption[] = [
  { code: "us", name: "United States", currency: "USD ($)" },
  { code: "in", name: "India", currency: "INR (₹)" },
  { code: "uk", name: "United Kingdom", currency: "GBP (£)" },
  { code: "ca", name: "Canada", currency: "CAD ($)" },
  { code: "au", name: "Australia", currency: "AUD ($)" },
  { code: "de", name: "Germany", currency: "EUR (€)" },
  { code: "fr", name: "France", currency: "EUR (€)" },
  { code: "jp", name: "Japan", currency: "JPY (¥)" },
];

const CATEGORIES = [
  { id: "mobiles", label: "Mobiles", icon: Smartphone, desc: "Phones, cases, accessories" },
  { id: "laptops", label: "Laptops", icon: Laptop, desc: "Notebooks, PCs, monitors" },
  { id: "headphones", label: "Headphones", icon: Headphones, desc: "Earbuds, over-ear, speakers" },
  { id: "fashion", label: "Fashion", icon: Shirt, desc: "Clothing, shoes, bags" },
  { id: "appliances", label: "Appliances", icon: Plug, desc: "Kitchen, laundry, smart home" },
  { id: "books", label: "Books", icon: BookOpen, desc: "Ebooks, fiction, academic" },
];

const BRANDS = [
  { id: "apple", label: "Apple", category: "Electronics" },
  { id: "samsung", label: "Samsung", category: "Electronics" },
  { id: "sony", label: "Sony", category: "Electronics" },
  { id: "dell", label: "Dell", category: "Electronics" },
  { id: "hp", label: "HP", category: "Electronics" },
  { id: "nike", label: "Nike", category: "Fashion" },
  { id: "adidas", label: "Adidas", category: "Fashion" },
  { id: "bose", label: "Bose", category: "Audio" },
  { id: "philips", label: "Philips", category: "Appliances" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selections
  const [selectedCountry, setSelectedCountry] = useState("us");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUserAction();
        if (!user) {
          toast.error("Please login to complete your onboarding");
          router.push("/auth");
        } else if (user.onboarded) {
          toast.success("Welcome back to Trendify!");
          router.push("/");
        } else {
          setLoadingUser(false);
        }
      } catch (err) {
        console.error("Auth check failed", err);
        router.push("/auth");
      }
    }
    checkAuth();
  }, [router]);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedCountry) {
      toast.error("Please select a target country");
      return;
    }
    if (step === 2 && selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    console.log("handleComplete: Clicked");
    setSaving(true);
    const toastId = toast.loading("Saving your onboarding profile...");
    try {
      console.log("handleComplete: Calling updateOnboardingAction with:", {
        selectedCountry,
        selectedCategories,
        selectedBrands,
      });
      const res = await updateOnboardingAction(
        selectedCountry,
        selectedCategories,
        selectedBrands
      );
      console.log("handleComplete: Received response:", res);
      if (res.success) {
        toast.success("Onboarding profile saved successfully!", { id: toastId });
        router.push(`/?gl=${selectedCountry}`);
        setTimeout(() => {
          router.refresh();
        }, 100);
      } else {
        toast.error(res.error || "Failed to save profile", { id: toastId });
      }
    } catch (e: any) {
      console.error("handleComplete: Client-side error caught:", e);
      toast.error(`An unexpected error occurred: ${e.message || e}`, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-screen bg-[#fafafa] dark:bg-black">
        <Loader2 className="size-10 animate-spin text-[#2874f0] dark:text-[#ffe500]" />
        <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-sm font-medium">
          Loading your onboarding profile...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative bg-[#fafafa] dark:bg-black min-h-screen">

      {/* Progress Stepper */}
      <div className="w-full max-w-2xl mb-8 z-10">
        <div className="flex items-center justify-between px-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div 
                className={cn(
                  "size-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300",
                  step >= num 
                    ? "bg-[#2874f0] border-[#2874f0] dark:bg-[#ffe500] dark:border-[#ffe500] text-white dark:text-black shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-650 border-zinc-200 dark:border-zinc-800"
                )}
              >
                {step > num ? <Check className="size-4" /> : num}
              </div>
              <span className={cn(
                "ml-2 text-xs font-semibold select-none hidden sm:inline",
                step === num ? "text-[#2874f0] dark:text-[#ffe500]" : "text-zinc-400 dark:text-zinc-500"
              )}>
                {num === 1 ? "Target Market" : num === 2 ? "Categories" : "Tracked Brands"}
              </span>
              {num < 3 && (
                <div className={cn(
                  "w-12 sm:w-20 h-0.5 mx-2 transition-all duration-300",
                  step > num ? "bg-[#2874f0] dark:bg-[#ffe500]" : "bg-zinc-200 dark:bg-zinc-800"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl z-10 transition-all duration-300">
        {/* STEP 1: REGION SELECTION */}
        {step === 1 && (
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-xl overflow-hidden pt-4 animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#2874f0] dark:text-[#ffe500] mb-1">
                <Globe2 className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Step 1 of 3</span>
              </div>
              <CardTitle className="text-2xl font-black">Select Target Market</CardTitle>
              <CardDescription>
                Choose your shopping country. We will configure pricing currencies and local stores (e.g. Amazon, Flipkart, Best Buy) based on your region.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCountry(c.code)}
                    className={cn(
                      "flex flex-col items-center p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:scale-102 hover:shadow-sm transition-all duration-200 text-center relative cursor-pointer",
                      selectedCountry === c.code 
                        ? "border-[#2874f0] bg-[#2874f0]/5 text-[#2874f0] dark:border-[#ffe500] dark:bg-[#ffe500]/5 dark:text-[#ffe500] ring-1 ring-[#2874f0]/30 dark:ring-[#ffe500]/30"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350"
                    )}
                  >
                    <Globe2 className="size-8 text-zinc-400 dark:text-zinc-500 mb-2" />
                    <span className="text-sm font-semibold">{c.name}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">{c.currency}</span>
                    {selectedCountry === c.code && (
                      <div className="absolute top-2 right-2 size-4 rounded-full bg-[#2874f0] dark:bg-[#ffe500] text-white dark:text-black flex items-center justify-center p-0.5">
                        <Check className="size-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-6 border-t border-zinc-100 dark:border-zinc-900">
              <Button 
                onClick={handleNextStep} 
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-semibold rounded-xl flex items-center gap-1.5 px-5 h-11 cursor-pointer"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: CATEGORY SELECTION */}
        {step === 2 && (
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-xl overflow-hidden pt-4 animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#2874f0] dark:text-[#ffe500] mb-1">
                <ShoppingBag className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Step 2 of 3</span>
              </div>
              <CardTitle className="text-2xl font-black">Choose Shopping Categories</CardTitle>
              <CardDescription>
                Select one or more categories that interest you. We will customize your dashboard feed with hot deals from these sectors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategories.includes(cat.label);
                  const IconComponent = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.label)}
                      className={cn(
                        "flex items-start gap-4 p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:shadow-sm text-left transition-all duration-200 relative cursor-pointer",
                        active 
                          ? "border-[#2874f0] bg-[#2874f0]/5 dark:border-[#ffe500] dark:bg-[#ffe500]/5 ring-1 ring-[#2874f0]/30 dark:ring-[#ffe500]/30"
                          : "border-zinc-200 dark:border-zinc-800"
                      )}
                    >
                      <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-500">
                        <IconComponent className="size-5" />
                      </div>
                      <div>
                        <h3 className={cn("font-bold text-sm", active ? "text-[#2874f0] dark:text-[#ffe500]" : "text-zinc-800 dark:text-zinc-200")}>
                          {cat.label}
                        </h3>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 leading-normal">{cat.desc}</p>
                      </div>
                      {active && (
                        <div className="absolute top-4 right-4 size-4 rounded-full bg-[#2874f0] dark:bg-[#ffe500] text-white dark:text-black flex items-center justify-center p-0.5">
                          <Check className="size-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-6 border-t border-zinc-100 dark:border-zinc-900">
              <Button 
                variant="outline"
                onClick={handlePrevStep}
                className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-semibold px-4 h-11 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button 
                onClick={handleNextStep} 
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-semibold rounded-xl flex items-center gap-1.5 px-5 h-11 cursor-pointer"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3: BRAND TRACKING */}
        {step === 3 && (
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-xl overflow-hidden pt-4 animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#2874f0] dark:text-[#ffe500] mb-1">
                <Bookmark className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Step 3 of 3</span>
              </div>
              <CardTitle className="text-2xl font-black">Track Your Favorite Brands</CardTitle>
              <CardDescription>
                (Optional) Select brands you buy from. We will highlight their discounts and notify you of low-price drops.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                {BRANDS.map((brand) => {
                  const active = selectedBrands.includes(brand.label);
                  return (
                    <button
                      key={brand.id}
                      onClick={() => toggleBrand(brand.label)}
                      className={cn(
                        "px-4 py-2 text-xs font-semibold rounded-full border transition-all duration-150 flex items-center gap-1.5 select-none cursor-pointer",
                        active 
                          ? "bg-[#2874f0] border-[#2874f0] text-white shadow-sm dark:bg-[#ffe500] dark:border-[#ffe500] dark:text-black"
                          : "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      )}
                    >
                      {brand.label}
                      <span className={cn("text-[9px] px-1 rounded-sm uppercase tracking-wide", active ? "bg-[#2874f0]/20 text-[#2874f0] dark:bg-[#ffe500]/20 dark:text-[#ffe500]" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500")}>
                        {brand.category}
                      </span>
                      {active && <Check className="size-3" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-6 border-t border-zinc-100 dark:border-zinc-900">
              <Button 
                variant="outline"
                onClick={handlePrevStep}
                className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-semibold px-4 h-11 flex items-center gap-1.5 cursor-pointer"
                disabled={saving}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button 
                onClick={handleComplete} 
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white font-semibold rounded-xl flex items-center gap-1.5 px-5 h-11 cursor-pointer"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1" />
                    Finalizing Profile...
                  </>
                ) : (
                  <>
                    Complete Onboarding
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
