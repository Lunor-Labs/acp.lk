import React, { useState, useEffect } from 'react';
import heroDesktop1 from '../../../assets/class-web-slider-1 .jpg';
import heroDesktop2 from '../../../assets/Hero 2 .jpg';
import heroDesktop3 from '../../../assets/Hero 3 .jpg';
import heroMobile1 from '../../../assets/mobile-header-1.jpeg';
import heroMobile2 from '../../../assets/mobile-header-2.jpeg';
import heroMobile3 from '../../../assets/mobile-header-3.jpeg';

interface HeroProps {
  onLoginRequest?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onLoginRequest }) => {
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
      {/* ── Mobile Hero (< md): 4:3 aspect ratio with mobile images ── */}
      <section
        className="relative md:hidden aspect-[4/3] w-full overflow-hidden bg-dark"
        id="home"
      >
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

        {/* Mobile Content */}
        <div className="relative z-10 w-full h-full flex flex-col justify-end px-4 pb-8 pointer-events-none">
          <div className="flex flex-row gap-3 w-full pointer-events-auto">
            <button
              onClick={onLoginRequest}
              className="bg-[#eb1b23] hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-full shadow-lg text-sm transition-all flex items-center justify-center gap-2 group"
            >
              Student Portal
              <div className="bg-white rounded-full p-0.5 group-hover:translate-x-1 transition-transform">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eb1b23" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <a
              href="#contact"
              className="bg-white hover:bg-gray-100 text-black font-bold px-5 py-2.5 rounded-full shadow-lg text-sm transition-all text-center flex items-center justify-center"
            >
              Contact Us
            </a>
          </div>

          {/* Carousel Dots */}
          <div className="flex gap-2 mt-4 pointer-events-auto">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-[#eb1b23] scale-125' : 'bg-white hover:bg-white/80'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
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

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-24 md:pb-12 pt-32 md:pt-60 flex flex-col md:flex-row items-center md:items-end justify-between min-h-screen pointer-events-none">
          {/* Left: Buttons Area */}
          <div className="w-full md:w-3/5 flex flex-col items-center md:items-start justify-end gap-8 md:gap-12 pb-12 pointer-events-auto mt-auto md:mt-0">

            {/* Buttons Area */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-xl">
              <button
                onClick={onLoginRequest}
                className="bg-[#eb1b23] hover:bg-red-700 text-white font-bold px-8 md:px-10 py-3 md:py-4 rounded-full shadow-lg text-lg md:text-xl transition-all w-full sm:w-auto flex items-center justify-center gap-3 group"
              >
                Student Portal
                <div className="bg-white rounded-full p-1 group-hover:translate-x-1 transition-transform">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eb1b23" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              <a
                href="#contact"
                className="bg-white hover:bg-gray-100 text-black font-bold px-8 md:px-10 py-3 md:py-4 rounded-full shadow-lg text-lg md:text-xl transition-all text-center w-full sm:w-auto flex items-center justify-center"
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
