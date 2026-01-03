import React from 'react';
import './Gallery.css';
import bgImage from '../../../assets/Bg.jpg';
import bg2 from '../../../assets/bg2.jpg';
import bg3 from '../../../assets/bg3.jpg';
import bg4 from '../../../assets/bg4.jpg';

const Gallery: React.FC = () => {
  const galleryImages = [
    bgImage,
    bg2,
    bg3,
    bg4,
  ];

  // Duplicate images for seamless infinite loop
  const allImages = [...galleryImages, ...galleryImages];

  return (
    <section className="gallery" id="gallery">
      {/* Header Section */}
      <div className="gallery-header">
        <div className="gallery-header-container">
          <h2 className="gallery-title">Our Gallery</h2>
          <p className="gallery-description">
            Ornare id fames interdum porttitor nulla turpis etiam. Diam vitae sollicitudin at nec nam et pharetra gravida. Adipiscing a quis ultrices eu ornare tristique vel nisl orci.
          </p>
        </div>
      </div>

      {/* Gallery Images */}
      <div className="gallery-carousel">
        <div className="gallery-carousel-wrapper">
          <div className="gallery-images-container">
            {allImages.map((image, index) => (
              <div
                key={index}
                className="gallery-image-item"
                style={{
                  backgroundImage: `url(${image})`
                }}
              />
            ))}
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="gallery-dots">
          {galleryImages.map((_, index) => (
            <span
              key={index}
              className="gallery-dot"
            ></span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;

