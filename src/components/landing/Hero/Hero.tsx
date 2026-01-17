import React from 'react';
import studentImage from '../../../assets/web mobile.png';

interface HeroProps {
  onLoginRequest?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onLoginRequest }) => {
  return (
    <section className="relative min-h-screen bg-neutral-white pt-24 pb-16 px-6" id="home">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary px-4 py-2 rounded-full mb-6 animate-slide-in">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-sm">Top Rated Physics Tuition</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl lg:text-7xl font-black text-neutral-black leading-tight mb-6">
              Master
              <span className="block text-primary mt-2">A/L Physics</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl text-neutral-gray-700 mb-4 font-medium">
              with අමිල සී.එදිරිමාන්න
            </p>

            {/* Description */}
            <p className="text-lg text-neutral-gray-600 mb-8 max-w-xl leading-relaxed">
              Join 1000+ students achieving excellent results. Expert online tuition for GCE Advanced Level Physics.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-black text-primary">2000+</div>
                <div className="text-sm text-neutral-gray-600 font-semibold mt-1">A Grades</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-black text-primary">1000+</div>
                <div className="text-sm text-neutral-gray-600 font-semibold mt-1">Students</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-black text-primary">10+</div>
                <div className="text-sm text-neutral-gray-600 font-semibold mt-1">Years</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onLoginRequest}
                className="group bg-primary hover:bg-primary-600 text-neutral-white font-bold px-8 py-4 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <span>Join Student Portal</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>

              <button
                onClick={() => {
                  const element = document.getElementById('contact');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-neutral-white border-2 border-neutral-gray-300 hover:border-primary text-neutral-black font-bold px-8 py-4 rounded-lg transition-all duration-300 hover:shadow-lg"
              >
                Contact Us
              </button>
            </div>

            {/* Trust Badge */}
            <div className="mt-8 flex items-center gap-3 text-sm text-neutral-gray-600">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary-100 border-2 border-neutral-white flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">A</span>
                  </div>
                ))}
              </div>
              <span className="font-semibold">Join 1000+ successful students</span>
            </div>
          </div>

          {/* Right Image */}
          <div className="order-1 lg:order-2 relative">
            {/* Main Image Container */}
            <div className="relative">
              {/* Background Decoration */}
              <div className="absolute -top-6 -right-6 w-full h-full bg-primary-50 rounded-3xl -z-10"></div>

              {/* Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={studentImage}
                  alt="Physics Tuition"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-50 rounded-full blur-3xl opacity-30 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-30 -z-10"></div>
    </section>
  );
};

export default Hero;
