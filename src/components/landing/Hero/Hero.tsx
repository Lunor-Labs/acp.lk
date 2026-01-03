import React from 'react';
import './Hero.css';
import studentImage from '../../../assets/web mobile.png';

interface HeroProps {
  onLoginRequest?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onLoginRequest }) => {

  return (
    <section className="hero" id="home">
      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-8 lg:py-0">
        {/* Image Side - Moves down on mobile */}
        <div className="relative flex justify-center lg:justify-start order-2 lg:order-1 mobile-image-container">
          <div className="relative w-[340px] h-[440px] sm:w-[450px] sm:h-[550px] bg-primary blob-shape overflow-hidden flex items-end justify-center shadow-2xl">
            <img
              alt="Tutor teaching a student"
              className="relative z-10 object-cover w-full h-full object-center transform scale-105 translate-y-4"
              src={studentImage}
            />

          </div>

          {/* Dotted path background element */}
          <svg className="absolute -z-10 top-1/2 left-0 transform -translate-y-1/2 w-full max-w-[600px] pointer-events-none opacity-20" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 250 C 50 150, 200 100, 300 200 S 450 350, 500 250" stroke="#F49D37" fill="transparent" strokeDasharray="8 8" strokeWidth="2" />
          </svg>
        </div>

        {/* Text Side - Stays at top on mobile */}
        <div className="order-1 lg:order-2 text-center lg:text-left pt-10 lg:pt-0 relative mobile-text-container">
          <div className="absolute -top-12 right-10 lg:right-20 text-gray-200 animate-pulse">
            <span className="material-icons text-6xl">star</span>
          </div>

          <h2 className="text-primary font-bold tracking-widest uppercase text-xs mb-6 block">
            General Certificate of Education Advanced Level
          </h2>

          <h1 className="text-6xl lg:text-8xl font-display font-bold text-text-main leading-tight mb-8">
            Online
            <span className="relative inline-block mt-4 lg:mt-0">
              <span className="relative z-10 px-4">Physics</span>
              <span className="absolute inset-0 bg-secondary rounded-full transform -rotate-2 scale-105 z-0 top-3 h-[85%] opacity-90"></span>
            </span>
          </h1>

          {/* Teacher Name with Gradient Effect */}
          <div className="teacher-name-container mb-4">
            <div className="teacher-name text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient relative inline-block">
              අමිල සී.එදිරිමාන්න
              <div className="shine-overlay"></div>
            </div>
          </div>

          {/* English Tagline with Underline Effect */}
          <div className="tagline-container mb-8">
            <p className="tagline-english text-xl font-bold text-text-main max-w-md mx-auto lg:mx-0 leading-relaxed relative inline-block">
              <span className="relative z-10">Excellent Results are Our Guarantee</span>
              <span className="tagline-underline absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 transform -skew-x-12 opacity-40"></span>
            </p>
          </div>

          {/* Sinhala Tagline with Glow Effect */}
          <p className="tagline-sinhala text-lg font-semibold mb-12 max-w-md mx-auto lg:mx-0 leading-relaxed text-primary glow-text">
            විශිෂ්ට ප්‍රතිඵල, අපගේ සහතිකයයි...
          </p>

          {/* Student Portal Button */}
          <button
            onClick={onLoginRequest}
            className="student-portal-btn bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-12 py-6 rounded-2xl shadow-2xl shadow-blue-300/50 transition-all duration-300 flex items-center group transform hover:scale-110 hover:shadow-blue-400/60 inline-flex border-2 border-transparent hover:border-white/20"
          >
            <span className="material-icons mr-3 text-2xl group-hover:rotate-12 transition-transform duration-300">school</span>
            Student Portal
            <span className="material-icons ml-3 group-hover:translate-x-2 transition-transform duration-300">arrow_forward</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
