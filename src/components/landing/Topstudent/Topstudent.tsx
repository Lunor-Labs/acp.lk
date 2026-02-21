import React, { useState } from 'react';
import studentImage from '../../../assets/student1.png';
import type { TopStudent } from '../../../types/landing';

const Topstudent: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('2026 A/L Physics');

  const allStudents: TopStudent[] = [
    { rank: 1, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 2, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 3, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 4, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 5, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 6, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 7, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 8, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 9, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 10, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
  ];

  const filters = ['2026 A/L Physics', '2025 A/L Physics', '2024 A/L Physics'];

  return (
    <section className="landing-section bg-white" id="top10">
      <div className="landing-container">
        <div className="text-center mb-16">
          <h2 className="landing-title">Paper Class Top 10 Students</h2>
          <p className="landing-description">
            Recognizing excellence in our physics paper classes. These students have demonstrated exceptional performance and dedication.
          </p>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${activeFilter === filter
                    ? 'bg-primary text-dark shadow-lg shadow-primary/20'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student List Section */}
      <div className="w-full overflow-hidden py-12">
        <div className="flex w-max animate-scroll-horizontal hover:[animation-play-state:paused] will-change-transform gap-8 px-8">
          {[...allStudents, ...allStudents].map((student, index) => (
            <div
              key={`${student.rank}-${index}`}
              className="w-72 landing-card flex flex-col items-center gap-4 relative pt-12"
            >
              {/* Rank Badge */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary text-dark rounded-full flex items-center justify-center font-black text-2xl shadow-xl border-4 border-white">
                {student.rank}
              </div>

              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-inner">
                <img
                  src={student.image || studentImage}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-center">
                <h4 className="font-bold text-dark text-lg mb-1">{student.name}</h4>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-4">{student.school}</p>

                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Score:</span>
                  <span className="font-bold text-primary">{student.marks}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Topstudent;


