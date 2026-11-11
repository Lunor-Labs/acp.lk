import React from 'react';

const Discussion: React.FC = () => {
  return (
    <section className="landing-section overflow-hidden" id="discussion">
      <div className="landing-container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Side - UI Card */}
        <div className="relative flex justify-center items-center order-2 lg:order-1">
          <div className="relative w-full max-w-lg">
            {/* Blurred Background Shapes */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl blur-3xl opacity-60 -rotate-12"></div>
            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl blur-3xl opacity-60 rotate-12"></div>

            {/* Main White Card */}
            <div className="relative bg-white rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4 border border-gray-50">
              {/* Top Left Icon */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-gray-50 z-20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Video Feeds */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 flex items-center justify-between text-[10px] text-white backdrop-blur-sm">
                    <span className="font-medium">Patricia Mendoza</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12L5 8L9 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 8V20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Discussion Status */}
              <div className="py-3">
                <p className="text-sm font-bold text-dark mb-1">Private Discussion</p>
                <p className="text-[10px] text-gray uppercase tracking-wider font-semibold">Your video can't be seen by others</p>
              </div>

              {/* End Discussion Button */}
              <button className="w-full bg-primary hover:bg-primary-500 text-dark font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40">
                End Discussion
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Text Content */}
        <div className="text-center lg:text-left order-1 lg:order-2">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
            <span className="text-primary block mb-2">ලංකාවේ ඉහළම</span>
            <span className="text-success block"> ප්‍රතිඵල ලබන පන්තිය</span>
          </h2>
          <p className="text-lg text-gray leading-relaxed max-w-xl mx-auto lg:mx-0">
            Teachers and teacher assistants can talk with students privately without leaving the Zoom environment, ensuring personalized attention and effective learning.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Discussion;


