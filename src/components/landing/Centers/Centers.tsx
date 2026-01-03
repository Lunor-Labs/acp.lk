import React from 'react';
import './Centers.css';
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
    <section className="centers" id="centers">
      {/* Header Section */}
      <div className="centers-header">
        <div className="centers-header-container">
          <h2 className="centers-title">Our Class Centers</h2>
          <p className="centers-description">
            Ornare id fames interdum porttitor nulla turpis etiam. Diam vitae sollicitudin at nec nam et pharetra gravida. Adipiscing a quis ultrices eu ornare tristique vel nisl orci.
          </p>
        </div>
      </div>

      {/* Cards Section */}
      <div className="centers-content">
        <div className="centers-container">
          {centers.map((center, index) => (
            <div key={index} className="center-card">
              <div
                className="center-card-image"
                style={{ backgroundImage: `url(${center.image})` }}
              >
                <div className="center-card-badge">
                  {index === 0 && (
                    <div className="badge premium">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                      </svg>
                      Premium
                    </div>
                  )}
                  {index === 1 && (
                    <div className="badge featured">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                      </svg>
                      Featured
                    </div>
                  )}
                  {index === 2 && (
                    <div className="badge online">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <path d="m12 1 2.09 6.26L21 8.27l-5 4.87 1.18 6.88L12 15.77l-6.18 3.25L7 12.14 2 8.27l6.91-1.01L12 1z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Live Online
                    </div>
                  )}
                </div>
                <div className="center-card-overlay">
                  <div className="center-info">
                    <div className="center-icon">
                      {index === 0 && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                        </svg>
                      )}
                      {index === 1 && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-7 7z" fill="currentColor"/>
                        </svg>
                      )}
                      {index === 2 && (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-7 7z" fill="currentColor"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </div>
                    <div className="center-rating">
                      <div className="stars">
                        {[1,2,3,4,5].map(star => (
                          <svg key={star} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="rating-text">4.8</span>
                    </div>
                  </div>
                  <h3 className="center-card-title">{center.title}</h3>
                  <div className="center-features">
                    <div className="feature-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <path d="m12 1 2.09 6.26L21 8.27l-5 4.87 1.18 6.88L12 15.77l-6.18 3.25L7 12.14 2 8.27l6.91-1.01L12 1z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Expert Teachers
                    </div>
                    <div className="feature-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {index === 2 ? 'Interactive Sessions' : 'Small Batches'}
                    </div>
                  </div>
                  <button className="center-card-button">
                    <span>{center.buttonText}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Centers;

