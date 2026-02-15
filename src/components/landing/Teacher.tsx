import React from 'react';

const Teacher: React.FC = () => {
  const stats = [
    { label: 'Years Experience', value: '10+' },
    { label: 'Students', value: '500+' },
    { label: 'Success Rate', value: '95%' },
  ];

  return (
    <section className="landing-section bg-gray-50/50" id="teacher">
      <div className="landing-container">
        <div className="text-center">
          <h2 className="landing-title">Meet Our Expert Teacher</h2>
          <p className="landing-description">
            Learn from experienced educators dedicated to your success
          </p>
        </div>

        <div className="flex justify-center">
          <div className="landing-card max-w-4xl w-full flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
            <div className="flex-shrink-0">
              <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center p-1 shadow-2xl">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#f3b113" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#f3b113" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-grow">
              <h3 className="text-3xl font-bold text-dark mb-2">අමිල සී.එදිරිමාන්න</h3>
              <p className="text-xl text-primary font-semibold mb-6">Physics Teacher</p>
              <p className="text-gray leading-relaxed mb-8">
                Experienced Advanced Level Physics teacher with a proven track record of excellent results.
                Dedicated to helping students achieve their academic goals through comprehensive teaching methods.
              </p>
              <div className="grid grid-cols-3 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center md:items-start">
                    <span className="text-2xl md:text-3xl font-bold text-dark">{stat.value}</span>
                    <span className="text-xs md:text-sm text-gray font-medium">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Teacher;


