import React, { useEffect, useMemo, useRef, useState } from 'react';

import studentImage from '@/assets/student1.webp';

interface TopStudent {
  rank: number;
  name: string;
  school: string;
  marks: number;
  image: string;
  year: string;
}

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
    // TODO: fetch from /api/top-students once backend route is available
    // Falls back to STATIC_STUDENTS / STATIC_FILTERS
    setFilters(STATIC_FILTERS);
    setAllStudents(STATIC_STUDENTS);
    setActiveFilter(STATIC_FILTERS[0]);
  }, []);

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const currentIndexRef = useRef<number>(0); // normalized index: 0 to len-1
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const isAnimatingRef = useRef<boolean>(false);
  const autoScrollTimerRef = useRef<number | null>(null);

  // students filtered by selected year
  const filteredStudents = useMemo(
    () => allStudents.filter((student) => student.year === activeFilter),
    [allStudents, activeFilter]
  );


  // simple duplicated list for CSS-based marquee animation (desktop)
  const marqueeStudents = useMemo(
    () => [...filteredStudents, ...filteredStudents],
    [filteredStudents]
  );


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

    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }

    const cloneCount = filteredStudents.length * 5;

    const timeout = setTimeout(() => {
      const container = carouselRef.current;
      if (!container) return;
      const target = container.children[cloneCount] as HTMLElement | undefined;
      if (!target) return;
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const delta = targetRect.left - containerRect.left;
      container.scrollTo({ left: container.scrollLeft + delta, behavior: 'auto' });
    }, 50);

    return () => clearTimeout(timeout);
  }, [activeFilter, filteredStudents.length]);



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

        {/* Mobile & tablet: same CSS marquee as desktop */}
        <div className="lg:hidden relative w-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex w-max animate-scroll-horizontal will-change-transform py-10 gap-10 px-10">
            {marqueeStudents.map((student, idx) => (
              <div
                key={'mobile-' + idx + '-' + student.rank}
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
      </div>

    </section>

  );

};



export default Topstudent;





