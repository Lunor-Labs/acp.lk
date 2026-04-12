import React, { useState, useEffect } from 'react';
import heroDesktop1 from '@/assets/hero1.webp';
import heroDesktop2 from '@/assets/hero2.webp';
import heroDesktop3 from '@/assets/hero3.webp';
import heroMobile1 from '@/assets/mobhero1.webp';
import heroMobile2 from '@/assets/mobhero2.webp';
import heroMobile3 from '@/assets/mobhero3.webp';

import { useAuth } from '@/contexts/AuthContext';

interface HeroProps {
  onLoginRequest?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onLoginRequest }) => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { desktop: heroDesktop1, mobile: heroMobile1 },
    { desktop: heroDesktop2, mobile: heroMobile2 },
    { desktop: heroDesktop3, mobile: heroMobile3 },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <>
      {/* ── Mobile Hero (< md): portrait slider with overlay ── */}
      <section
        className="relative md:hidden w-full overflow-hidden bg-dark"
        id="home"
      >
        {/* 9:16 container matching mobile images */}
        <div className="relative w-full aspect-[9/16]">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 z-[-1]'
                }`}
            >
              <img
                src={slide.mobile}
                alt={`Hero Slide ${index + 1}`}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-[1]" />

          {/* Bottom overlay: buttons + dots */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3 flex flex-col items-center gap-3">
            {/* Buttons row */}
            <div className="flex flex-row gap-3 justify-center w-full">
              <button
                onClick={onLoginRequest}
                className="bg-gradient-to-r from-[#eb1b23] to-[#b31219] hover:from-[#f02b33] hover:to-[#c4151d] text-white font-semibold px-5 py-2.5 rounded-full shadow-[0_8px_20px_-5px_rgba(235,27,35,0.6)] text-xs transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-1.5 group whitespace-nowrap border border-red-500/30"
              >
                {user ? 'Go to Portal' : 'Student Portal'}
                <div className="bg-white rounded-full p-0.5 group-hover:translate-x-1 transition-transform shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eb1b23" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              <a
                href="#contact"
                className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-full shadow-[0_8px_20px_-5px_rgba(0,0,0,0.4)] text-xs transition-all duration-300 hover:-translate-y-0.5 text-center flex items-center justify-center whitespace-nowrap"
              >
                Contact Us
              </a>
            </div>

            {/* Carousel Dots */}
            <div className="flex gap-2 justify-center w-full">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-[#eb1b23] scale-125' : 'bg-white hover:bg-white/80'
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Desktop Hero (>= md): unchanged original layout ── */}
      <section
        className="relative hidden md:flex min-h-screen items-center overflow-hidden bg-dark"
        id="home"
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 z-[-1]'
              }`}
          >
            <img
              src={slide.desktop}
              alt={`Hero Slide ${index + 1}`}
              className="w-full h-full object-cover object-center"
            />
          </div>
        ))}

        {/* Dark gradient overlay for elegant contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-[1] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-24 md:pb-12 pt-32 md:pt-60 flex flex-col md:flex-row items-center md:items-end justify-between min-h-screen pointer-events-none">
          {/* Left: Buttons Area */}
          <div className="w-full md:w-3/5 flex flex-col items-center md:items-start justify-end gap-8 md:gap-12 pb-12 pointer-events-auto mt-auto md:mt-0">

            {/* Buttons Area */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-xl">
              <button
                onClick={onLoginRequest}
                className="bg-gradient-to-r from-[#eb1b23] to-[#b31219] hover:from-[#f02b33] hover:to-[#c4151d] text-white font-semibold tracking-wide px-8 md:px-10 py-3 md:py-4 rounded-full shadow-[0_10px_40px_-10px_rgba(235,27,35,0.7)] hover:shadow-[0_10px_40px_-5px_rgba(235,27,35,0.9)] text-lg md:text-xl transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-3 group border border-red-500/30"
              >
                {user ? 'Go to Portal' : 'Student Portal'}
                <div className="bg-white rounded-full p-1 group-hover:translate-x-1 transition-transform shadow-md">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eb1b23" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              <a
                href="#contact"
                className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold tracking-wide px-8 md:px-10 py-3 md:py-4 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] text-lg md:text-xl transition-all duration-300 hover:-translate-y-1 text-center w-full sm:w-auto flex items-center justify-center"
              >
                Contact Us
              </a>
            </div>
          </div>

          {/* Right: Empty for spacing on desktop */}
          <div className="hidden md:block w-2/5"></div>

          {/* Carousel Dots */}
          <div className="absolute bottom-6 md:bottom-12 left-1/2 transform -translate-x-1/2 flex gap-3 z-20 pointer-events-auto">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-[#eb1b23] scale-125' : 'bg-white hover:bg-white/80'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
