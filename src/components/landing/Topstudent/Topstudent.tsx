import React, { useEffect, useMemo, useRef, useState } from 'react';

import studentImage from '../../../assets/student1.webp';

import type { TopStudent } from '../../../types/landing';
import { testResultRepository } from '../../../repositories/TestResultRepository';

// Static fallback data when DB has no results yet
const STATIC_STUDENTS: TopStudent[] = [
  // 2026 A/L Physics (10 students)
  { rank: 1, name: 'Sashini Imesha', school: 'Bandaranayaka College Veyangoda', marks: 95, image: studentImage, year: '2026 A/L Physics' },
  { rank: 2, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 93, image: studentImage, year: '2026 A/L Physics' },
  { rank: 3, name: 'Dinithi Perera', school: 'Musaeus College Colombo', marks: 91, image: studentImage, year: '2026 A/L Physics' },
  { rank: 4, name: 'Kasun Madushanka', school: 'Royal College Colombo', marks: 89, image: studentImage, year: '2026 A/L Physics' },
  { rank: 5, name: 'Nethmi Hansika', school: 'Visakha Vidyalaya Colombo', marks: 87, image: studentImage, year: '2026 A/L Physics' },
  { rank: 6, name: 'Pasindu Ranasinghe', school: 'Ananda College Colombo', marks: 85, image: studentImage, year: '2026 A/L Physics' },
  { rank: 7, name: 'Tharindu Dilshan', school: 'Mahanama College Colombo', marks: 83, image: studentImage, year: '2026 A/L Physics' },
  { rank: 8, name: 'Harini Rathnayake', school: 'Girls High School Kandy', marks: 81, image: studentImage, year: '2026 A/L Physics' },
  { rank: 9, name: 'Sewmini Fernando', school: 'Holy Family Convent Colombo', marks: 79, image: studentImage, year: '2026 A/L Physics' },
  { rank: 10, name: 'Supun Jayawardena', school: 'Dharmaraja College Kandy', marks: 77, image: studentImage, year: '2026 A/L Physics' },
  // 2025 A/L Physics
  { rank: 1, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 92, image: studentImage, year: '2025 A/L Physics' },
  { rank: 2, name: 'Sashini Imesha', school: 'Bandaranayaka College Veyangoda', marks: 90, image: studentImage, year: '2025 A/L Physics' },
  { rank: 3, name: 'Dinithi Perera', school: 'Musaeus College Colombo', marks: 88, image: studentImage, year: '2025 A/L Physics' },
  { rank: 4, name: 'Kasun Madushanka', school: 'Royal College Colombo', marks: 86, image: studentImage, year: '2025 A/L Physics' },
  { rank: 5, name: 'Nethmi Hansika', school: 'Visakha Vidyalaya Colombo', marks: 84, image: studentImage, year: '2025 A/L Physics' },
  { rank: 6, name: 'Pasindu Ranasinghe', school: 'Ananda College Colombo', marks: 82, image: studentImage, year: '2025 A/L Physics' },
  { rank: 7, name: 'Tharindu Dilshan', school: 'Mahanama College Colombo', marks: 80, image: studentImage, year: '2025 A/L Physics' },
  { rank: 8, name: 'Harini Rathnayake', school: 'Girls High School Kandy', marks: 78, image: studentImage, year: '2025 A/L Physics' },
  { rank: 9, name: 'Sewmini Fernando', school: 'Holy Family Convent Colombo', marks: 76, image: studentImage, year: '2025 A/L Physics' },
  { rank: 10, name: 'Supun Jayawardena', school: 'Dharmaraja College Kandy', marks: 74, image: studentImage, year: '2025 A/L Physics' },
  // 2024 A/L Physics
  { rank: 1, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 90, image: studentImage, year: '2024 A/L Physics' },
  { rank: 2, name: 'Sashini Imesha', school: 'Bandaranayaka College Veyangoda', marks: 88, image: studentImage, year: '2024 A/L Physics' },
  { rank: 3, name: 'Dinithi Perera', school: 'Musaeus College Colombo', marks: 86, image: studentImage, year: '2024 A/L Physics' },
  { rank: 4, name: 'Kasun Madushanka', school: 'Royal College Colombo', marks: 84, image: studentImage, year: '2024 A/L Physics' },
  { rank: 5, name: 'Nethmi Hansika', school: 'Visakha Vidyalaya Colombo', marks: 82, image: studentImage, year: '2024 A/L Physics' },
  { rank: 6, name: 'Pasindu Ranasinghe', school: 'Ananda College Colombo', marks: 80, image: studentImage, year: '2024 A/L Physics' },
  { rank: 7, name: 'Tharindu Dilshan', school: 'Mahanama College Colombo', marks: 78, image: studentImage, year: '2024 A/L Physics' },
  { rank: 8, name: 'Harini Rathnayake', school: 'Girls High School Kandy', marks: 76, image: studentImage, year: '2024 A/L Physics' },
  { rank: 9, name: 'Sewmini Fernando', school: 'Holy Family Convent Colombo', marks: 74, image: studentImage, year: '2024 A/L Physics' },
  { rank: 10, name: 'Supun Jayawardena', school: 'Dharmaraja College Kandy', marks: 72, image: studentImage, year: '2024 A/L Physics' },
];
const STATIC_FILTERS = ['2026 A/L Physics', '2025 A/L Physics', '2024 A/L Physics'];
const Topstudent: React.FC = () => {

  const [activeFilter, setActiveFilter] = useState('');
  const [allStudents, setAllStudents] = useState<TopStudent[]>(STATIC_STUDENTS);
  const [filters, setFilters] = useState<string[]>(STATIC_FILTERS);

  // Load data from DB; fall back to static data if DB is empty
  useEffect(() => {
    testResultRepository.getYearLabels().then(async (labels) => {
      if (labels.length === 0) {
        setFilters(STATIC_FILTERS);
        setAllStudents(STATIC_STUDENTS);
        setActiveFilter(STATIC_FILTERS[0]);
        return;
      }
      // Load top10 per label and merge into allStudents array
      const all: TopStudent[] = [];
      for (const label of labels) {
        const top10 = await testResultRepository.getTop10ByYearLabel(label);
        top10.forEach((s) => all.push({ ...s, image: s.image || studentImage }));
      }
      setAllStudents(all);
      setFilters(labels);
      setActiveFilter(labels[0]);
    }).catch(() => {
      // Keep static data on error
      setFilters(STATIC_FILTERS);
      setAllStudents(STATIC_STUDENTS);
      setActiveFilter(STATIC_FILTERS[0]);
    });
  }, []);

  // When filters are ready, ensure activeFilter is set
  useEffect(() => {
    if (!activeFilter && filters.length > 0) {
      setActiveFilter(filters[0]);
    }
  }, [filters]);

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const currentIndexRef = useRef<number>(0); // normalized index: 0 to len-1
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const touchStartXRef = useRef<number | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const autoScrollTimerRef = useRef<number | null>(null);

  // students filtered by selected year
  const filteredStudents = useMemo(
    () => allStudents.filter((student) => student.year === activeFilter),
    [allStudents, activeFilter]
  );

  // display list with 5 full sets of clones at either end for seamless looping
  const displayStudents = useMemo(() => {
    if (filteredStudents.length <= 1) return filteredStudents;

    const cloneSets = 5;
    const leftClones = Array.from({ length: cloneSets }, () => filteredStudents).flat();
    const rightClones = Array.from({ length: cloneSets }, () => filteredStudents).flat();

    return [...leftClones, ...filteredStudents, ...rightClones];
  }, [filteredStudents]);

  // simple duplicated list for CSS-based marquee animation (desktop)
  const marqueeStudents = useMemo(
    () => [...filteredStudents, ...filteredStudents],
    [filteredStudents]
  );

  const SMOOTH_SCROLL_DURATION = 800; // milliseconds
  const AUTO_SCROLL_INTERVAL = 2000; // milliseconds
  const AUTO_SCROLL_MIN_ITEMS = 7; // disable auto-scroll if items <= this

  // Clone count for proper display index calculation (5 full sets)
  const cloneCount = useMemo(() => filteredStudents.length * 5, [filteredStudents.length]);

  const getDisplayIndex = (normalizedIndex: number, len: number, isWrappingBackward: boolean = false): number => {
    if (len <= 1) return 0;

    // Normal case: item N maps to display index N + cloneCount
    let displayIndex = normalizedIndex + cloneCount;

    // If wrapping backward (going to last from 0), use left clones area
    if (isWrappingBackward && normalizedIndex === len - 1) {
      displayIndex = cloneCount - 1;
    }

    return displayIndex;
  };

  // Scroll smoothly to a display index, return promise when done
  const scrollToDisplayIndex = (displayIndex: number, useSmooth: boolean = true): Promise<void> => {
    return new Promise<void>((resolve) => {
      const container = carouselRef.current;
      if (!container) {
        resolve();
        return;
      }

      const target = container.children[displayIndex] as HTMLElement | undefined;
      if (!target) {
        resolve();
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const delta = targetRect.left - containerRect.left;
      const scrollLeft = container.scrollLeft + delta;

      container.scrollTo({
        left: scrollLeft,
        behavior: useSmooth ? 'smooth' : 'auto',
      });

      // Wait for animation to complete
      const duration = useSmooth ? SMOOTH_SCROLL_DURATION : 50;
      setTimeout(resolve, duration);
    });
  };

  // Navigate to a specific normalized index (0 to len-1)
  const navigateToIndex = async (nextNormalizedIndex: number, isWrappingBackward: boolean = false) => {
    const len = filteredStudents.length;
    if (len === 0 || isAnimatingRef.current) return;

    isAnimatingRef.current = true;

    try {
      const displayIndex = getDisplayIndex(nextNormalizedIndex, len, isWrappingBackward);

      // Scroll smoothly to target
      await scrollToDisplayIndex(displayIndex, true);

      // If we used a clone area, snap back to real item instantly
      // Left clone area: displayIndex < cloneCount
      // Right clone area: displayIndex >= cloneCount + len
      if ((displayIndex < cloneCount || displayIndex >= cloneCount + len) && len > 1) {
        const realDisplayIndex = nextNormalizedIndex + cloneCount;
        await scrollToDisplayIndex(realDisplayIndex, false);
      }

      // Update current index for next navigation
      currentIndexRef.current = nextNormalizedIndex;
    } finally {
      isAnimatingRef.current = false;
    }
  };

  const handlePrev = () => {
    if (isAnimatingRef.current) return;

    const len = filteredStudents.length;
    if (len === 0) return;

    const nextIndex = (currentIndexRef.current - 1 + len) % len;
    const isWrappingBack = nextIndex === len - 1 && currentIndexRef.current === 0;

    navigateToIndex(nextIndex, isWrappingBack);
  };

  const handleNext = () => {
    if (isAnimatingRef.current) return;

    const len = filteredStudents.length;
    if (len === 0) return;

    const nextIndex = (currentIndexRef.current + 1) % len;
    navigateToIndex(nextIndex, false);
  };

  // detect viewport size so we can change behaviour/interval
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // when on desktop, disable any user-initiated scrolling on the carousel
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const prevent = (e: Event) => {
      e.preventDefault();
    };

    if (isDesktop) {
      container.addEventListener('wheel', prevent, { passive: false });
      container.addEventListener('touchmove', prevent, { passive: false });
    }

    return () => {
      container.removeEventListener('wheel', prevent);
      container.removeEventListener('touchmove', prevent);
    };
  }, [isDesktop]);

  // auto-scroll disabled: movement is CSS-only on desktop, manual swipe/buttons on mobile/tablet
  useEffect(() => {
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  }, [filteredStudents, isDesktop]);

  // reset carousel when filter changes
  useEffect(() => {
    currentIndexRef.current = 0;
    isAnimatingRef.current = false;

    // Clear any pending auto-scroll timer
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }

    // Brief delay to ensure DOM is updated before scrolling
    const timeout = setTimeout(() => {
      scrollToDisplayIndex(cloneCount, false);
    }, 50);

    return () => clearTimeout(timeout);
  }, [activeFilter, cloneCount]);



  return (

    <section
      className="landing-section bg-black overflow-x-hidden"
      id="top10"
      style={{ paddingLeft: 0, paddingRight: 0 }}
    >

      <div className="landing-container overflow-x-hidden">

        <div className="text-center mb-16">

          <h2 className="landing-title text-white px-4 sm:px-0 text-3xl sm:text-4xl md:text-5xl max-w-full font-black mb-8">
            <span className="text-[#eb1b23]">Paper</span> Class <span className="text-[#eb1b23]">Top 10</span> Student List
          </h2>

          {/* Filter Buttons */}

          <div className="flex flex-wrap justify-center gap-4 mt-8 max-w-4xl mx-auto px-4">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`px-6 sm:px-8 py-3 text-sm sm:text-base font-bold whitespace-nowrap rounded-full transition-all duration-300 ${
                  activeFilter === filter
                    ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-600/50 border border-[#eb1b23] scale-105'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

        </div>

      </div>



      {/* Student List Section - responsive carousel */}

      <div className="w-full" style={{ backgroundColor: '#000000' }}>

        {/* Desktop: CSS-based continuous scroll like Gallery */}
        <div className="hidden lg:block relative w-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex w-max animate-scroll-horizontal hover:[animation-play-state:paused] will-change-transform py-10 gap-10 px-10">
            {marqueeStudents.map((student, idx) => (
              <div
                key={idx + '-' + student.rank}
                className="flex-shrink-0 w-56 h-64 landing-card flex flex-col items-center gap-4 relative pt-20 pb-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg border border-slate-700/50"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 border-[#eb1b23] shadow-red-600/50 bg-slate-900" style={{ boxShadow: '0 0 30px rgba(235, 27, 35, 0.4)' }}>
                  <img
                    src={student.image || studentImage}
                    alt={student.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                <div className="text-center px-4 flex-1 flex flex-col justify-center">
                  <p className="text-3xl font-extrabold mb-1" style={{ color: '#eb1b23' }}>
                    {student.marks}%
                  </p>
                  <p className="text-sm font-semibold mb-2 text-slate-400">
                    Rank {student.rank.toString().padStart(2, '0')}
                  </p>
                  <h4 className="font-extrabold text-white text-base mb-1 whitespace-nowrap truncate">{student.name}</h4>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{student.school}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile & tablet: keep existing swipeable carousel */}
        <div className="lg:hidden relative w-full flex items-center overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>

          {/* Mobile chevron (overlay) */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#eb1b23] text-[#eb1b23] bg-black/60 hover:bg-[#eb1b23] hover:text-white transition-all duration-300"
            aria-label="Previous student mobile"
          >
            &#8249;
          </button>

          {/* Carousel track */}
          {/* hide native scrollbar across browsers */}
          <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
          <div
            ref={carouselRef}
            className="overflow-x-auto no-scrollbar w-full py-10 snap-x snap-mandatory flex gap-10"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            onTouchStart={(e) => {
              if (!isAnimatingRef.current) {
                touchStartXRef.current = e.touches[0].clientX;
              }
            }}
            onTouchEnd={(e) => {
              if (isAnimatingRef.current) {
                touchStartXRef.current = null;
                return;
              }

              const startX = touchStartXRef.current;
              if (startX === null) return;

              const endX = e.changedTouches[0].clientX;
              const diff = startX - endX;

              if (Math.abs(diff) > 50) {
                if (diff > 0) {
                  handleNext();
                } else {
                  handlePrev();
                }
              }

              touchStartXRef.current = null;
            }}
          >
            {displayStudents.map((student, idx) => (
              <div
                key={idx + '-' + student.rank}
                className="flex-shrink-0 w-64 h-80 landing-card flex flex-col items-center gap-4 relative pt-20 pb-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg border border-slate-700/50 snap-center"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 border-[#eb1b23] bg-slate-900" style={{ boxShadow: '0 0 30px rgba(235, 27, 35, 0.4)' }}>
                  <img
                    src={student.image || studentImage}
                    alt={student.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                <div className="text-center px-4 flex-1 flex flex-col justify-center">
                  <p className="text-3xl font-extrabold mb-1" style={{ color: '#eb1b23' }}>
                    {student.marks}%
                  </p>
                  <p className="text-sm font-semibold mb-2 text-slate-400">
                    Rank {student.rank.toString().padStart(2, '0')}
                  </p>
                  <h4 className="font-extrabold text-white text-base mb-1 whitespace-nowrap truncate">{student.name}</h4>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{student.school}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right chevron - mobile overlay */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#eb1b23] text-[#eb1b23] bg-black/60 hover:bg-[#eb1b23] hover:text-white transition-all duration-300"
            aria-label="Next student mobile"
          >
            &#8250;
          </button>
        </div>
      </div>

    </section>

  );

};



export default Topstudent;





