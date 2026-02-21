import React from 'react';
import "./Centers.css";

// Import images so Vite bundles them correctly
import image1 from '../../../assets/clz-banner.jpg';
import image2 from '../../../assets/second-slider-second.jpg';
import image3 from '../../../assets/image.png';

const Centers: React.FC = () => {
  const centersImages = [
    {
      src: image1,
      alt: 'Islandwide Online class center',
    },
    {
      src: image2,
      alt: 'Vision Institute class center',
    },
    {
      src: image3,
      alt: 'Riochem Institute class center',
    }
  ];

  return (
    <section className="centers-section" id="centers">
      <div className="centers-container">

        {/* Header */}
        <div className="centers-header">
          <h2 className="centers-title">
            Our <span className="centers-class-text">Class</span> Centers
          </h2>
        </div>

        {/* Grid Layout */}
        <div className="centers-grid">
          {/* Left Large Image */}
          <div className="centers-grid-left">
            <div className="centers-image-card centers-image-large">
              <img
                src={centersImages[0].src}
                alt={centersImages[0].alt}
                className="centers-image"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right Stacked Images */}
          <div className="centers-grid-right">
            <div className="centers-image-card">
              <img
                src={centersImages[1].src}
                alt={centersImages[1].alt}
                className="centers-image"
                loading="lazy"
              />
            </div>
            <div className="centers-image-card">
              <img
                src={centersImages[2].src}
                alt={centersImages[2].alt}
                className="centers-image"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Centers;
