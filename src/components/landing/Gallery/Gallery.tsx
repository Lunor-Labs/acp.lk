import React, { useState } from 'react';
import bgImage from '../../../assets/Bg.jpg';
import bg2 from '../../../assets/bg2.jpg';
import bg3 from '../../../assets/bg3.jpg';
import bg4 from '../../../assets/bg4.jpg';

const Gallery: React.FC = () => {
  const galleryImages = [bgImage, bg2, bg3, bg4];
  const [activeIndex, setActiveIndex] = useState(0);

  // Duplicate images for seamless infinite loop
  const allImages = [...galleryImages, ...galleryImages];

  return (
    <section className="landing-section bg-white py-20" id="gallery">

      {/* Header Section */}
      <div className="landing-container mb-16">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="text-black">Our </span>
            <span style={{ color: "#9E111A" }}>Gallery</span>
          </h2>
        </div>
      </div>

      {/* Gallery Images Container */}
      <div className="relative w-full overflow-hidden pb-20">

        {/* Top Curve */}
        <div
          className="absolute top-0 left-0 w-full h-20 bg-white z-10"
          style={{
            clipPath: "ellipse(80% 100% at 50% 0%)"
          }}
        />

        {/* Images */}
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

        {/* Bottom Curve */}
        <div
          className="absolute bottom-0 left-0 w-full h-20 bg-white z-10"
          style={{
            clipPath: "ellipse(80% 100% at 50% 100%)"
          }}
        />

        {/* Slider Dots */}
        <div className="flex justify-center items-center gap-3 mt-12 relative z-20">
          {galleryImages.map((_, index) => (
            <span
              key={index}
              onClick={() => setActiveIndex(index)}
              className="w-3 h-3 rounded-full border cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: activeIndex === index ? "#9E111A" : "#FFFFFF",
                borderColor: "#9E111A"
              }}
            />
          ))}
        </div>

      </div>

    </section>
  );
};

export default Gallery;