import React, { useState } from 'react';
import type { Review } from '../../../types/landing';

const Reviews: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const reviews: Review[] = [
    {
      id: 1,
      text: 'සර් උගන්වන ඉංග්‍රීසි පාඩම්වලින් කියලා හැම විෂයක පොඩිම පොඩිම ප්‍රශ්න වුනත් අදාළව සර් නිතිතම තමයි හොඳම විදිහ',
      name: 'Amara Fernando',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 2,
      text: 'සර් උගන්වපු විදිහට, අභ්‍යාශයට කියලා ඉතාමොන්න කියලා පාඩම් එපා එපා මං සෙන්සුස් පුළුවන් කෙනාට දෙන්න පුළුවන් විදිහට සර්ලා තේරුම් කරදෙනව තාම කියනො',
      name: 'Kavindu Silva',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 3,
      text: 'සර් නිසා තමයි මම අද විශයාව පෙරළවීම අතෙ සපය සර් නිතිතම පාඩම් වලින් හොඳොම සීමාව පරතෙහසත් ගොඩක් තිකිලා හොඳවුවා',
      name: 'Nisha Perera',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 4,
      text: 'සර් උගන්වන ඉංග්‍රීසි පාඩම්වලින් කියලා හැම විෂයක පොඩිම පොඩිම ප්‍රශ්න වුනත් අදාළව සර් නිතිතම තමයි හොඳම විදිහ',
      name: 'Roshan Gunasekara',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
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
    <section className="landing-section bg-gradient-to-b from-white to-gray-50" id="reviews">
      <div className="landing-container">
        <div className="text-center mb-16">
          <h3 className="landing-title">Student Reviews</h3>
          <p className="landing-description">
            Ornare id fames interdum porttitor nulla turpis etiam. Diam vitae sollicitudin at nec nam et pharetra gravida. Adipiscing a quis ultrices eu ornare tristique vel nisl orci.
          </p>
        </div>

        <div className="relative flex items-center gap-4 md:gap-8 lg:gap-12">
          {/* Navigation Buttons for Large Screens */}
          <button
            className="hidden md:flex flex-shrink-0 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-dark hover:text-primary transition-all duration-300 hover:scale-110 z-10"
            onClick={handlePrev}
            aria-label="Previous review"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex-grow overflow-hidden relative py-8">
            <div
              className="flex transition-transform duration-500 ease-in-out gap-6"
              style={{ transform: `translateX(-${currentIndex * (100 / reviews.length)}%)` }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="min-w-full md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)] landing-card flex flex-col items-center text-center relative"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-primary text-4xl font-serif">
                    "
                  </div>
                  <p className="text-gray text-sm leading-8 my-8 flex-grow italic">
                    {review.text}
                  </p>
                  <div className="flex flex-col items-center gap-4 mt-auto">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shadow-lg p-0.5">
                      <img src={review.image} alt={review.name} className="w-full h-full object-cover rounded-full" />
                    </div>
                    <p className="font-bold text-dark">{review.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="hidden md:flex flex-shrink-0 w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-dark hover:text-primary transition-all duration-300 hover:scale-110 z-10"
            onClick={handleNext}
            aria-label="Next review"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden justify-center gap-4 mt-8">
          <button
            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
            onClick={handlePrev}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
            onClick={handleNext}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Reviews;