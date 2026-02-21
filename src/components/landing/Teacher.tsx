import React from 'react';
import teacherImg from '../../assets/Teacher 1 R.png';

const Teacher: React.FC = () => {
  return (
    <section className="relative bg-black py-20 lg:py-32 overflow-hidden" id="teacher" style={{ fontFamily: "'Inter', 'Noto Sans Sinhala', sans-serif" }}>
      {/* Background Watermark Texts */}
      <div className="absolute top-20 right-0 pointer-events-none select-none opacity-10 hidden lg:block">
        <span className="text-[220px] font-black leading-none tracking-tighter text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" }}>
          AMILA
        </span>
      </div>
      <div className="absolute bottom-20 right-0 pointer-events-none select-none opacity-10 hidden lg:block">
        <span className="text-[220px] font-black leading-none tracking-tighter text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" }}>
          AMILA
        </span>
      </div>

      <div className="landing-container relative z-10 px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Content - Bio */}
          <div className="w-full lg:w-3/5 text-white">
            <h2 className="text-5xl md:text-6xl font-black mb-12 flex flex-wrap items-center gap-x-4">
              <span className="text-[#E31E24]" style={{ letterSpacing: '-0.02em', fontWeight: 900 }}>ගුරුවරයා</span>
              <span className="text-white" style={{ letterSpacing: '-0.02em', fontWeight: 900 }}>පිළිබදව</span>
            </h2>

            <div className="space-y-8 text-gray-100 text-lg md:text-xl font-medium leading-[1.8] max-w-2xl">
              <p>
                2012 වසරෙහි ගණිත විෂය ධාරාවෙන් උසස්පෙළ හදාරා පළමුවරම A සාමාර්ථ 03ක් ලබාගනිමින් උසස්පෙළ විශිෂ්ට ලෙස සමත් විය.
                ගණිත අංශයෙහි ඉහළම ප්‍රතිඵල ලබාගත් සිසුන්ගේ සිහින සරසවිය වන මොරටුව විශ්ව විද්‍යාලයට ඇතුළත්ව සිවිල් ඉංජිනේරු විද්‍යාව පිළිබඳ උපාධිය සාර්ථකව අවසන්කර ඇත.
                විශ්ව විද්‍යාල කාලයේ සිට උපකාරක පන්ති ක්ෂේත්‍රයට එළඹෙන ඔහු 2021 වර්ෂයේ සිට පූර්ණකාලීනව භෞතික විද්‍යා ගුරුවරයෙකු ලෙස කටයුතු කරයි.
              </p>

              <p>
                2022 පළමු පුනරීක්ෂණයට සහභාගී වූ සිසුන්ගෙන් 1/6ක් වෛද්‍ය හා ඉංජිනේරු පීඨ වලට තේරී පත් වූ අතර 2023 පළමු සිද්ධාන්ත පන්තියෙන් නගරයේ හොඳම විද්‍යා/ගණිත ප්‍රතිඵලය බිහි කලගුරුවරයා වේ.
                අඛණ්ඩව සිසුන් අතර විශ්වාසවන්තව හා විශිෂ්ටතම භෞතික විද්‍යා පන්තිය නිර්මාණය කිරීමට හැකිවන්නේ ඔහු සතු අසීමිත කැපවිරීමක ප්‍රතිඵලයක් වශයෙනි.
              </p>
            </div>

            <div className="mt-16">
              <h3 className="text-5xl md:text-6xl font-bold text-white tracking-wide" style={{ fontFamily: "'Noto Sans Sinhala', sans-serif" }}>
                අමිල සී.එදිරිමාන්න
              </h3>
              <div className="mt-2 h-1 w-48 bg-white/30 rounded-full"></div>
            </div>
          </div>

          {/* Right Content - Teacher Image */}
          <div className="w-full lg:w-2/5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[500px]">
              <img
                src={teacherImg}
                alt="Amila C Edirimanna"
                className="w-full h-auto relative z-20 drop-shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Teacher;




