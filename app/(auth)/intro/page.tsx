"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const slides = [
  {
    id: 1,
    image: "/images/intro1.png",
    title: "Transform Your Body",
    description: "Track workouts, nutrition, and progress\nAll in one place",
  },
  {
    id: 2,
    image: "/images/intro2.png",
    title: "Train With Experts",
    description: "Get personalized workout plans from\ncertified fitness trainers",
  },
  {
    id: 3,
    image: "/images/intro3.png",
    title: "Nutrition Made Simple",
    description: "Follow meal plans tailored to your goals.\nTrack every bite effortlessly.",
  },
  {
    id: 4,
    image: "/images/getSarted.png",
    title: "See Real Results",
    description: "Track your progress with charts, photos, and\nweekly reports.",
  }
];

export default function IntroPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  // Prevent hydration mismatch if using localStorage directly in render
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleContinue = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      router.push("/login");
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black font-sans">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={slides[currentSlide].image} 
            alt={slides[currentSlide].title}
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* Subtle fade overlay that brings text to focus */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end px-6 pb-12 w-full max-w-md mx-auto">

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <h1 className="text-[28px] font-bold text-white mb-3 tracking-tight drop-shadow-md">
              {slides[currentSlide].title}
            </h1>
            <p className="text-[14px] text-[#a3e635] font-medium leading-[1.6] whitespace-pre-line px-4 drop-shadow-sm">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handleContinue}
          className="w-full bg-[#a3e635] hover:bg-[#b5f745] text-black font-semibold text-[16px] py-[16px] rounded-[12px] tracking-wide transition-colors shadow-[0_4px_15px_rgba(163,230,53,0.3)] active:scale-[0.98] mb-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
