import React, { useState } from 'react';
import type { Review } from '../../../types/landing';
import testimonialBg from '../../../assets/testimonial-bg.png';

const Reviews: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [offset, setOffset] = useState(0); // percentage translateX for desktop row
  const [enableTransition, setEnableTransition] = useState(false);

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

  const currentReview = reviews[currentIndex];
  const prevReview =
    reviews[(currentIndex - 1 + reviews.length) % reviews.length];
  const nextReview = reviews[(currentIndex + 1) % reviews.length];

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setEnableTransition(true);
    setOffset(35.5); // move row right a bit
    setTimeout(() => {
      setEnableTransition(false); // snap back without animation
      setOffset(0);
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
      );
      setIsAnimating(false);
    }, 500);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setEnableTransition(true);
    setOffset(-35.5); // move row left a bit
    setTimeout(() => {
      setEnableTransition(false); // snap back without animation
      setOffset(0);
      setCurrentIndex((prevIndex) =>
        prevIndex >= reviews.length - 1 ? 0 : prevIndex + 1
      );
      setIsAnimating(false);
    }, 500);
  };

  return (
    <section
      className="landing-section relative bg-black/90"
      id="reviews"
      style={{
        backgroundImage: `url(${testimonialBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="landing-container flex flex-col items-center">
        <div className="text-center mb-10 md:mb-14">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            What Our <span className="text-red-500">Students</span> Say
          </h3>
        </div>

        <div className="relative w-full flex items-center justify-center">
          {/* Mobile: single centered card */}
          <div className="w-full overflow-x-hidden py-10 md:hidden">
            <div className="flex justify-center">
              <div className="w-full max-w-md mx-auto flex flex-col items-center">
                <div className="relative w-full bg-gradient-to-b from-neutral-800 to-neutral-900 border border-white/60 rounded-[32px] px-6 py-10 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between min-h-[380px]">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white bg-black/80 overflow-hidden flex items-center justify-center">
                    <img
                      src={currentReview.image}
                      alt={currentReview.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h4 className="mt-8 text-xl font-bold">{currentReview.name}</h4>
                  <p className="mt-6 text-sm leading-relaxed text-gray-100 max-w-2xl mx-auto">
                    {currentReview.text}
                  </p>

                  <div className="mt-6 flex justify-center gap-1 text-yellow-400">
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: three cards (prev, current, next) with cropped sides */}
          <div className="hidden md:block w-full overflow-hidden py-12 md:py-16">
            <div
              className={`flex justify-center gap-6 lg:gap-10 ${
                enableTransition ? 'transition-transform duration-500 ease-in-out' : ''
              }`}
              style={{ transform: `translateX(${offset}%)` }}
            >
              {[prevReview, currentReview, nextReview].map((review, index) => (
                <div
                  key={review.id + '-' + index}
                  className="flex-shrink-0 w-[22rem] lg:w-[26rem] flex flex-col items-center"
                >
                  <div className="relative w-full bg-gradient-to-b from-neutral-800 to-neutral-900 border border-white/60 rounded-[32px] px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between min-h-[380px] md:min-h-[420px] lg:min-h-[440px]">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white bg-black/80 overflow-hidden flex items-center justify-center">
                      <img
                        src={review.image}
                        alt={review.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <h4 className="mt-8 text-xl md:text-2xl font-bold">{review.name}</h4>
                    <p className="mt-6 text-sm md:text-base leading-relaxed md:leading-8 text-gray-100 max-w-2xl mx-auto">
                      {review.text}
                    </p>

                    <div className="mt-6 flex justify-center gap-1 text-yellow-400">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white bg-neutral-900 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-colors duration-300"
            onClick={handlePrev}
            aria-label="Previous review"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white bg-neutral-900 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-colors duration-300"
            onClick={handleNext}
            aria-label="Next review"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Reviews;