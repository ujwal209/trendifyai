"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PROMO_BANNERS } from "@/lib/products";

export default function PromoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? PROMO_BANNERS.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === PROMO_BANNERS.length - 1 ? 0 : prev + 1));
  };

  const setSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setInterval(nextSlide, 5000); // Autoplay every 5 seconds
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isHovered]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative mx-auto mt-2 h-44 w-full max-w-7xl overflow-hidden rounded-md shadow-sm sm:h-56 md:h-64 lg:h-72"
    >
      {/* Slides */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {PROMO_BANNERS.map((banner) => (
          <div
            key={banner.id}
            className={`relative h-full w-full flex-shrink-0 bg-gradient-to-r ${banner.bgGradient} flex items-center justify-between px-6 sm:px-12 md:px-16`}
          >
            {/* Promo Info */}
            <div className="z-10 max-w-lg text-white">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#ffe500]">
                {banner.badge}
              </span>
              <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
                {banner.title}
              </h2>
              <p className="mt-1 text-xs opacity-90 sm:text-sm md:text-base">
                {banner.subtitle}
              </p>
              <button className="mt-3 rounded bg-[#ffe500] px-4 py-1.5 text-xs font-bold text-black shadow transition-all hover:scale-105 hover:bg-[#ffe500]/90 sm:mt-4 sm:px-6 sm:py-2 sm:text-sm">
                Shop Now
              </button>
            </div>

            {/* Promo Image */}
            <div className="absolute right-0 top-0 h-full w-1/2 md:w-2/5">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-inherit to-inherit" />
              <img
                src={banner.image}
                alt={banner.title}
                className="h-full w-full object-cover object-center opacity-85 mix-blend-overlay"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Left Arrow */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-sm transition-all hover:bg-white/80 hover:text-black md:h-10 md:w-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Right Arrow */}
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-white backdrop-blur-sm transition-all hover:bg-white/80 hover:text-black md:h-10 md:w-10"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {PROMO_BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentIndex === index ? "w-6 bg-white" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
