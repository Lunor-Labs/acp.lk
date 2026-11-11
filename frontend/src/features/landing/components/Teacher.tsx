import React from 'react';
import desktopBg from '@/assets/about-bg-desktop.webp';
import mobileBg from '@/assets/about-bg-mobile.webp';
import signatureImg from '@/assets/signature.png';

const Teacher: React.FC = () => {
  return (
    <section
      id="teacher"
      className="relative overflow-hidden"
      style={{ fontFamily: "'Inter', 'Noto Sans Sinhala', sans-serif" }}
    >
      {/* ─── DESKTOP LAYOUT ─── */}
      <div
        className="hidden lg:block relative w-full"
        style={{
          backgroundImage: `url(${desktopBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
        }}
      >
        {/* Dark vignette – covers the left empty zone */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.65) 46%, rgba(0,0,0,0.08) 58%, transparent 100%)',
          }}
        />

        {/* TEXT BLOCK – absolutely centred inside the dark left zone */}
        <div
          className="absolute z-10 text-white"
          style={{
            left: '6%',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '46%',
          }}
        >
          {/* Section label */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-10 bg-[#E31E24]" />
            <span className="text-[#E31E24] text-sm font-bold uppercase tracking-[0.2em]">
              About the Teacher
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-5xl xl:text-6xl font-black mb-10 leading-tight">
            <span className="text-[#E31E24]">ගුරුවරයා</span>{' '}
            <span className="text-white">පිළිබදව</span>
          </h2>

          {/* Bio paragraphs */}
          <div className="space-y-6 text-gray-200 text-base xl:text-lg font-medium leading-[1.9]">
            <p>
              2012 වසරෙහි ගණිත විෂය ධාරාවෙන් උසස්පෙළ හදාරා පළමුවරම A සාමාර්ථ 03ක්
              ලබාගනිමින් උසස්පෙළ විශිෂ්ට ලෙස සමත් විය. ගණිත අංශයෙහි ඉහළම ප්‍රතිඵල
              ලබාගත් සිසුන්ගේ සිහින සරසවිය වන මොරටුව විශ්ව විද්‍යාලයට ඇතුළත්ව සිවිල්
              ඉංජිනේරු විද්‍යාව පිළිබඳ උපාධිය සාර්ථකව අවසන්කර ඇත.
            </p>
            <p>
              විශ්ව විද්‍යාල කාලයේ සිට උපකාරක පන්ති ක්ෂේත්‍රයට එළඹෙන ඔහු 2021 වර්ෂයේ
              සිට පූර්ණකාලීනව භෞතික විද්‍යා ගුරුවරයෙකු ලෙස කටයුතු කරයි.
            </p>
            <p>
              2022 පළමු පුනරීක්ෂණයට සහභාගී වූ සිසුන්ගෙන් 1/6ක් වෛද්‍ය හා ඉංජිනේරු
              පීඨ වලට තේරී පත් වූ අතර 2023 පළමු සිද්ධාන්ත පන්තියෙන් නගරයේ හොඳම
              විද්‍යා/ගණිත ප්‍රතිඵලය බිහි කල ගුරුවරයා වේ.
            </p>
          </div>

          {/* Signature */}
          <div className="mt-10">
            <img
              src={signatureImg}
              alt="අමිල සී. එදිරිමාන්න"
              className="h-16 xl:h-20 w-auto object-contain"
              style={{ filter: 'invert(1)' }}
            />
          </div>
        </div>
      </div>

      {/* ─── MOBILE LAYOUT ─── */}
      <div
        className="flex lg:hidden relative w-full flex-col"
        style={{
          backgroundImage: `url(${mobileBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          minHeight: '100svh',
        }}
      >
        {/* Gradient – dark at top for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.12) 65%, transparent 100%)',
          }}
        />

        {/* TEXT BLOCK – top of mobile image (empty upper area) */}
        <div className="relative z-10 w-full px-6 pt-14 pb-8 text-white">
          {/* Section label */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-[#E31E24]" />
            <span className="text-[#E31E24] text-xs font-bold uppercase tracking-[0.2em]">
              About the Teacher
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl font-black mb-6 leading-tight">
            <span className="text-[#E31E24]">ගුරුවරයා</span>{' '}
            <span className="text-white">පිළිබදව</span>
          </h2>

          {/* Bio paragraphs */}
          <div className="space-y-4 text-gray-200 text-sm font-medium leading-[1.85] max-w-sm">
            <p>
              2012 වසරෙහි ගණිත විෂය ධාරාවෙන් උසස්පෙළ හදාරා පළමුවරම A සාමාර්ථ 03ක්
              ලබාගනිමින් සමත් විය. මොරටුව විශ්ව විද්‍යාලයේ සිවිල් ඉංජිනේරු
              විද්‍යාව පිළිබඳ උපාධිය සාර්ථකව අවසන් කළේය.
            </p>
            <p>
              2021 සිට පූර්ණකාලීන භෞතික විද්‍යා ගුරුවරයෙකු ලෙස කටයුතු කරමින්
              2023 දී නගරයේ හොඳම ප්‍රතිඵල බිහිකළ ගුරුවරයා වේ.
            </p>
          </div>

          {/* Signature */}
          <div className="mt-6">
            <img
              src={signatureImg}
              alt="අමිල සී. එදිරිමාන්න"
              className="h-12 w-auto object-contain"
              style={{ filter: 'invert(1)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Teacher;
