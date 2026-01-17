import React from 'react';
import type { ClassCenter } from '../../../types/landing';

const Centers: React.FC = () => {
  const centers: ClassCenter[] = [
    {
      title: 'Riochem Institute',
      buttonText: 'Visit Center',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=center'
    },
    {
      title: 'Nanoda Walsmulla',
      buttonText: 'Visit Center',
      image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=600&fit=crop&crop=center'
    },
    {
      title: 'Islandwide Online',
      buttonText: 'Join Live Classes',
      image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&h=600&fit=crop&crop=center'
    }
  ];

  const badges = ['Premium', 'Featured', 'Live Online'];
  const icons = ['star', 'star', 'live'];

  const renderIcon = (type: string) => {
    if (type === 'star') {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" strokeWidth="2" />
        <path d="M12 1v4m0 14v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <section className="relative bg-dark py-24" id="centers">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-neutral-white mb-4">
            Our <span className="text-primary">Class Centers</span>
          </h2>
          <p className="text-lg text-gray max-w-2xl mx-auto">
            Choose from our physical locations or join our live online classes from anywhere in Sri Lanka.
          </p>
        </div>

        {/* Centers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {centers.map((center, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2"
            >
              {/* Image Background */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${center.image})` }}
              ></div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-dark/40"></div>

              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col justify-between min-h-[400px]">

                {/* Bottom Content */}
                <div>

                  {/* Title */}
                  <h3 className="text-3xl font-black text-neutral-white mb-4">
                    {center.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Background Decoration */}
      <div className="absolute top-20 left-10 w-32 h-32 border-4 border-primary/20 rounded-full"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 border-4 border-gray-700 rounded-full"></div>
    </section>
  );
};

export default Centers;
