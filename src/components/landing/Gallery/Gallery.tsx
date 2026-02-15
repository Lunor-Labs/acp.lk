import React from 'react';
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
    <section className="landing-section bg-white" id="gallery">
      {/* Header Section */}
      <div className="landing-container mb-16">
        <div className="text-center">
          <h2 className="landing-title">Our Gallery</h2>
          <p className="landing-description">
            Ornare id fames interdum porttitor nulla turpis etiam. Diam vitae sollicitudin at nec nam et pharetra gravida. Adipiscing a quis ultrices eu ornare tristique vel nisl orci.
          </p>
        </div>
      </div>

      {/* Gallery Images Container */}
      <div className="relative w-full overflow-hidden pb-12">
        <div className="flex w-max animate-scroll-horizontal hover:[animation-play-state:paused] will-change-transform">
          {allImages.map((image, index) => (
            <div
              key={index}
              className="w-[100vw] md:w-[50vw] lg:w-[25vw] h-[300px] md:h-[400px] lg:h-[500px] bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${image})`
              }}
            />
          ))}
        </div>

        {/* Navigation Dots (Visual Only) */}
        <div className="flex justify-center items-center gap-3 mt-12">
          {galleryImages.map((_, index) => (
            <span
              key={index}
              className="w-3 h-3 rounded-full bg-dark/20"
            ></span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;


