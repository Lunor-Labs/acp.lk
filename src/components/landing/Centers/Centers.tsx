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

  return (
    <section className="landing-section bg-dark" id="centers">
      <div className="landing-container">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Our <span className="text-primary">Class Centers</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Choose from our physical locations or join our live online classes from anywhere in Sri Lanka.
          </p>
        </div>

        {/* Centers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {centers.map((center, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 aspect-[4/5]"
            >
              {/* Image Background */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${center.image})` }}
              ></div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-transparent"></div>

              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col justify-end h-full">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {center.title}
                </h3>
                <button className="text-primary font-semibold flex items-center gap-2 group/btn">
                  {center.buttonText}
                  <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Centers;
