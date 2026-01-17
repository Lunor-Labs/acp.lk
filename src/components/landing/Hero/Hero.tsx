import React from 'react';
import heroDesktop from '../../../assets/hero-desktop.jpg';

interface HeroProps {
  onLoginRequest?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onLoginRequest }) => {
  return (
    <section className="relative min-h-screen bg-dark flex items-center overflow-hidden" id="home">
      {/* Desktop Hero Image */}
      <div className="absolute inset-0 hidden lg:block">
        <img
          src={heroDesktop}
          alt="Online Physics - AL Tuition"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Mobile Hero Image - Show original on mobile */}
      <div className="absolute inset-0 lg:hidden">
        <img
          src={heroDesktop}
          alt="Online Physics - AL Tuition"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-dark/20"></div>

      {/* Content - Minimal, let the image speak */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 py-32 w-full">
        <div className="flex justify-center lg:justify-end items-center min-h-[70vh]">
          {/* CTA Button - Bottom Right */}
          <div className="absolute bottom-12 right-6 lg:bottom-20 lg:right-20">
            <button
              onClick={onLoginRequest}
              className="group relative bg-primary hover:bg-primary-500 text-dark font-black text-lg px-12 py-5 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10">Join Student Portal</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-300 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
