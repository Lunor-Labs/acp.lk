import React, { useState } from 'react';
import type { Review } from '../../../types/landing';

const Reviews: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const reviews: Review[] = [
    {
      id: 1,
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
      name: 'Kavindu Silva',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 5
    },
    {
      id: 2,
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
      name: 'Kavindu Silva',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 5
    },
    {
      id: 3,
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
      name: 'Kavindu Silva',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 5
    },
    {
      id: 4,
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
      name: 'Kavindu Silva',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      rating: 5
    }
  ];

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex >= reviews.length - 1 ? 0 : prevIndex + 1
    );
  };


  return (
    <section className="landing-section bg-gradient-to-b from-gray-900 to-black relative overflow-hidden" id="reviews">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="1"/>
              <path d="M 0 0 L 80 80 M 80 0 L 0 80" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="landing-container relative z-10">
        <div className="text-center mb-16">
          <h3 className="landing-title text-white text-4xl md:text-5xl font-bold">
            What Our <span style={{ color: '#d1291a' }}>Students</span> Say
          </h3>
        </div>

        <div className="relative flex items-center gap-4 md:gap-8 lg:gap-12">
          {/* Navigation Buttons for Large Screens - Hidden, shown at bottom */}
          <div className="flex-grow overflow-hidden relative py-8">
            <div
              className="flex transition-transform duration-500 ease-in-out gap-6"
              style={{ transform: `translateX(-${currentIndex * (100 / reviews.length)}%)` }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="min-w-full md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)] flex flex-col items-center text-center relative pt-12"
                >
                  {/* Profile Image positioned OUTSIDE and ABOVE the card */}
                  <div className="absolute -top-0 left-8 w-20 h-20 rounded-full overflow-hidden border-4 border-gray-600 shadow-xl z-10 bg-gray-700">
                    <img src={review.image} alt={review.name} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Card Content */}
                  <div 
                    className="w-full p-8 pt-12 rounded-2xl border border-gray-600 bg-gradient-to-b from-gray-700/40 to-gray-800/40 backdrop-blur-sm text-left"
                    style={{ 
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.03)' 
                    }}
                  >
                    {/* Name - Left aligned at top */}
                    <h4 className="font-bold text-white text-xl mb-4">{review.name}</h4>
                    
                    {/* Review Text - Left aligned */}
                    <p className="text-gray-300 text-sm leading-7 mb-6">
                      {review.text}
                    </p>
                    
                    {/* Star Rating - Left aligned at bottom */}
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                          fill={i < review.rating ? '#f3b113' : 'none'}
                          stroke={i < review.rating ? '#f3b113' : '#4a5568'}
                          strokeWidth="2"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Centered Navigation Buttons */}
        <div className="flex justify-center gap-4 mt-12">
          <button
            className="w-14 h-14 rounded-full bg-gray-700/50 border-2 border-gray-600 flex items-center justify-center text-red-500 hover:bg-gray-600/50 hover:border-red-500 transition-all duration-300"
            onClick={handlePrev}
            aria-label="Previous review"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="w-14 h-14 rounded-full bg-gray-700/50 border-2 border-gray-600 flex items-center justify-center text-red-500 hover:bg-gray-600/50 hover:border-red-500 transition-all duration-300"
            onClick={handleNext}
            aria-label="Next review"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Reviews;