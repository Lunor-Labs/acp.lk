import React from 'react';
import type { ProcessStep } from '@/types/landing';

const Process: React.FC = () => {
  const steps: ProcessStep[] = [
    {
      icon: 'document',
      title: 'නිවැරදි විෂය කරුණු',
      description: 'විෂය නිර්දේශය ආවරණය වන නිවැරදි විෂය කරුණු සම්පිණ්ඩණය කර සිසුන්ට ඉගැන්වීම'
    },
    {
      icon: 'calendar',
      title: 'විශේෂ ප්‍රශ්න පත්‍ර',
      description: 'සුවිශේෂ ප්‍රශ්න පත්‍ර මඟින් සිසුන් දැනුමින් සහ අත්දැකීම් මඟින් උසස් පෙළ විභාගයට සූදානම් කරවීම'
    },
    {
      icon: 'group',
      title: 'විශිෂ්ටතම ප්‍රතිඵල',
      description: 'අවසන් ප්‍රතිඵලක් ලෙස සිසුන්ට විශිෂ්ටතම ප්‍රතිඵලයක් ලබා ගැනීම සඳහා මඟපෙන්වීම'
    }
  ];

  const renderIcon = (iconType: string) => {
    const iconProps = { className: "w-8 h-8", fill: "none", stroke: "currentColor", strokeWidth: "2" };

    switch (iconType) {
      case 'document':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2V8H20M8 13H16M8 17H16M8 9H12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'calendar':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <rect x="3" y="6" width="18" height="15" rx="2" />
            <path d="M3 10H21M8 3V7M16 3V7" strokeLinecap="round" />
            <rect x="7" y="13" width="2" height="2" rx="0.5" fill="currentColor" />
            <rect x="11" y="13" width="2" height="2" rx="0.5" fill="currentColor" />
            <rect x="15" y="13" width="2" height="2" rx="0.5" fill="currentColor" />
          </svg>
        );
      case 'group':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="landing-section" id="process">
      <div className="landing-container">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-neutral-black mb-4">
            <span className="text-primary">All-In-One</span> Our Work Process
          </h2>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            A comprehensive approach combining all the essential tools and methods needed for successful A/L Physics education.
          </p>
        </div>

        {/* Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative bg-neutral-white border-2 border-gray-200 hover:border-primary rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              {/* Icon */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-dark rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-dark transition-all duration-300">
                  {renderIcon(step.icon)}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-neutral-black mb-3">
                {step.title}
              </h3>
              <p className="text-gray leading-relaxed">
                {step.description}
              </p>

              {/* Number Badge */}
              <div className="absolute top-6 right-6 w-10 h-10 bg-primary-50 text-primary rounded-full flex items-center justify-center font-black text-lg">
                {index + 1}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Process;
