import React, { useState, useEffect } from 'react';
import testimonialBg from '../../../assets/testimonial-bg.webp';
import { classReviewRepository } from '../../../repositories/ClassReviewRepository';

interface Review {
  id: number;
  text: string;
  name: string;
  image: string | null;
  gender: 'male' | 'female' | null;
  rating: number;
}

// ── Inline gender SVG avatars ───────────────────────────────────────────────
function MaleAvatarSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="50" r="50" fill="#3B82F6" />
      <ellipse cx="50" cy="85" rx="28" ry="20" fill="#1D4ED8" />
      <ellipse cx="50" cy="78" rx="22" ry="16" fill="#2563EB" />
      <circle cx="50" cy="38" r="20" fill="#FBBF24" />
      <ellipse cx="50" cy="22" rx="20" ry="10" fill="#1F2937" />
      <rect x="30" y="22" width="40" height="8" fill="#1F2937" />
      <circle cx="43" cy="37" r="3" fill="#1F2937" />
      <circle cx="57" cy="37" r="3" fill="#1F2937" />
      <circle cx="44" cy="36" r="1" fill="white" />
      <circle cx="58" cy="36" r="1" fill="white" />
      <path d="M43 44 Q50 50 57 44" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function FemaleAvatarSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="50" r="50" fill="#EC4899" />
      <ellipse cx="50" cy="87" rx="30" ry="18" fill="#BE185D" />
      <path d="M28 70 Q50 90 72 70 Q65 55 50 58 Q35 55 28 70Z" fill="#DB2777" />
      <circle cx="50" cy="38" r="20" fill="#FBBF24" />
      <ellipse cx="50" cy="24" rx="21" ry="12" fill="#7C3AED" />
      <rect x="29" y="24" width="8" height="26" rx="4" fill="#7C3AED" />
      <rect x="63" y="24" width="8" height="26" rx="4" fill="#7C3AED" />
      <circle cx="43" cy="37" r="3" fill="#1F2937" />
      <circle cx="57" cy="37" r="3" fill="#1F2937" />
      <circle cx="44" cy="36" r="1" fill="white" />
      <circle cx="58" cy="36" r="1" fill="white" />
      <path d="M43 44 Q50 50 57 44" stroke="#BE185D" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ReviewAvatar({ review, className }: { review: Review; className?: string }) {
  if (review.image) {
    return <img src={review.image} alt={review.name} className={className} />;
  }
  if (review.gender === 'male') {
    return <MaleAvatarSVG className={className} />;
  }
  if (review.gender === 'female') {
    return <FemaleAvatarSVG className={className} />;
  }
  // Generic fallback — single initial on a dark circle
  return (
    <div className={`${className ?? ''} flex items-center justify-center bg-neutral-700 text-white font-bold text-2xl`}>
      {review.name[0]?.toUpperCase()}
    </div>
  );
}

const STATIC_REVIEWS: Review[] = [
  {
    id: 1,
    text: 'සර් උගන්වන ඉංග්‍රීසි පාඩම්වලින් කියලා හැම විෂයක පොඩිම පොඩිම ප්‍රශ්න වුනත් අදාළව සර් නිතිතම තමයි හොඳම විදිහ',
    name: 'Amara Fernando',
    image: null,
    gender: 'male',
    rating: 5,
  },
  {
    id: 2,
    text: 'සර් උගන්වපු විදිහට, අභ්‍යාශයට කියලා ඉතාමොන්න කියලා පාඩම් එපා එපා මං සෙන්සුස් පුළුවන් කෙනාට දෙන්න පුළුවන් විදිහට සර්ලා තේරුම් කරදෙනව තාම කියනො',
    name: 'Kavindu Silva',
    image: null,
    gender: 'male',
    rating: 5,
  },
  {
    id: 3,
    text: 'සර් නිසා තමයි මම අද විශයාව පෙරළවීම අතෙ සපය සර් නිතිතම පාඩම් වලින් හොඳොම සීමාව පරතෙහසත් ගොඩක් තිකිලා හොඳවුවා',
    name: 'Nisha Perera',
    image: null,
    gender: 'female',
    rating: 5,
  },
  {
    id: 4,
    text: 'සර් උගන්වන ඉංග්‍රීසි පාඩම්වලින් කියලා හැම විෂයක පොඩිම පොඩිම ප්‍රශ්න වුනත් අදාළව සර් නිතිතම තමයි හොඳම විදිහ',
    name: 'Roshan Gunasekara',
    image: null,
    gender: 'male',
    rating: 4,
  }
];

const Reviews: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [offset, setOffset] = useState(0); // percentage translateX for desktop row
  const [enableTransition, setEnableTransition] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(STATIC_REVIEWS);

  useEffect(() => {
    classReviewRepository.getVisibleReviews().then((dbReviews) => {
      if (dbReviews.length > 0) {
        setReviews(
          dbReviews.map((r, idx) => ({
            id: idx + 1,
            text: r.review_text,
            name: r.student_name,
            image: r.student_image_url || null,
            gender: r.gender ?? null,
            rating: r.rating,
          }))
        );
      }
    }).catch(() => {
      // Keep static reviews on error
    });
  }, []);

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
          <div className="w-full overflow-x-hidden py-6 sm:py-8 md:py-10 md:hidden">
            <div className="flex justify-center px-4 sm:px-6">
              <div className="w-full max-w-xs sm:max-w-sm mx-auto flex flex-col items-center">
                <div className="relative w-full bg-gradient-to-b from-neutral-800 to-neutral-900 border border-white/60 rounded-[20px] sm:rounded-[28px] px-4 sm:px-6 pt-10 sm:pt-12 pb-5 sm:pb-6 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col items-center">
                  {/* Avatar */}
                  <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white bg-black/80 overflow-hidden flex items-center justify-center">
                    <ReviewAvatar review={currentReview} className="w-full h-full object-cover" />
                  </div>

                  {/* Name */}
                  <h4 className="text-sm sm:text-base font-bold mb-2">{currentReview.name}</h4>

                  {/* Stars */}
                  <div className="flex justify-center gap-0.5 text-yellow-400 text-sm sm:text-base mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < currentReview.rating ? 'text-yellow-400' : 'text-gray-500'}>
                        {i < currentReview.rating ? '★' : '☆'}
                      </span>
                    ))}
                  </div>

                  {/* Scrollable review text */}
                  <div className="w-full max-h-36 sm:max-h-44 overflow-y-auto overscroll-contain rounded-lg px-1"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                    <p className="text-xs sm:text-sm leading-relaxed text-gray-100">
                      {currentReview.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: three cards (prev, current, next) with cropped sides */}
          <div className="hidden md:block w-full overflow-hidden py-12 md:py-16">
            <div
              className={`flex justify-center gap-6 lg:gap-10 ${enableTransition ? 'transition-transform duration-500 ease-in-out' : ''
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
                      <ReviewAvatar review={review} className="w-full h-full object-cover" />
                    </div>

                    <h4 className="mt-8 text-xl md:text-2xl font-bold">{review.name}</h4>
                    <p className="mt-6 text-sm md:text-base leading-relaxed md:leading-8 text-gray-100 max-w-2xl mx-auto">
                      {review.text}
                    </p>

                    <div className="mt-6 flex justify-center gap-1 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-400"}>
                          {i < review.rating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Navigation Buttons — shown on both mobile and desktop */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white bg-neutral-900 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-colors duration-300"
            onClick={handlePrev}
            aria-label="Previous review"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="flex gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to review ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 h-2 bg-red-500'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <button
            className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white bg-neutral-900 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-colors duration-300"
            onClick={handleNext}
            aria-label="Next review"
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