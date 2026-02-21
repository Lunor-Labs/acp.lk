import React, { useState, useEffect } from 'react';
import heroDesktop1 from '../../../assets/class-web-slider-1 .jpg';
import heroDesktop2 from '../../../assets/Hero 2 .jpg';
import heroDesktop3 from '../../../assets/Hero 3 .jpg';
import heroMobileLeft from '../../../assets/hero-mobile-left.jpg';
import heroMobileRight from '../../../assets/hero-mobile-right.jpg';

interface HeroProps {
  onLoginRequest?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onLoginRequest }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: heroDesktop1,
    },
    {
      image: heroDesktop2,
    },
    {
      image: heroDesktop3,
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden bg-dark"
      id="home"
    >
      {/* Desktop Hero Images */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 hidden md:block transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 z-[-1]'}`}
        >
          <img
            src={slide.image}
            alt={`Hero Slide ${index + 1}`}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/60 lg:bg-black/50"></div>
        </div>
      ))}

      {/* Mobile Hero Images (split left/right) - Keeping original for simplicity or updating for slider if needed */}
      <div className="absolute inset-0 flex md:hidden">
        <img
          src={heroMobileLeft}
          alt="Hero Sword Fantasy Left"
          className="w-1/2 h-full object-cover object-left"
        />
        <img
          src={heroMobileRight}
          alt="Hero Sword Fantasy Right"
          className="w-1/2 h-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-12 pt-60 flex flex-col md:flex-row items-end justify-between min-h-screen">
        {/* Left: Buttons and Text */}
        <div className="w-full md:w-3/5 flex flex-col items-start justify-end gap-12">

          {/* Slide Text removed as per request */}

          {/* Buttons Area */}
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md mt-auto">
            <button
              onClick={onLoginRequest}
              className="bg-[#eb1b23] hover:bg-red-700 text-white font-bold px-10 py-4 rounded-full shadow-lg text-xl transition-all w-full sm:w-auto flex items-center justify-center gap-3 group"
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
              className="bg-white hover:bg-gray-100 text-black font-bold px-10 py-4 rounded-full shadow-lg text-xl transition-all text-center w-full sm:w-auto flex items-center justify-center"
            >
              Contact Us
            </a>
          </div>
        </div>

        {/* Right: Empty for spacing on desktop, image is background */}
        <div className="hidden md:block w-2/5"></div>

        {/* Carousel Dots */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
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
  );
};

export default Hero;
