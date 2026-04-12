import React from 'react';
import type { ClassCenter } from '../../../types/landing';

type CenterCardProps = ClassCenter;

const CenterCard: React.FC<CenterCardProps> = ({
  topTitle,
  title,
  titleHighlight,
  subtitle,
  description,
  buttonText,
  image,
  theme = 'light',
  rating = 5,
  brand,
}) => {
  return (
    <div className={`center-card-container ${theme === 'dark' ? 'center-card-dark' : 'center-card-light'}`}>
      {/* Image Section */}
      <div className="center-card-image-section">
        <img
          src={image}
          alt={title}
          className="center-card-graphic"
          loading="lazy"
        />
      </div>

      {/* Content Section */}
      <div className="center-card-content">
        {/* Brand (for Riochem) */}
        {brand && <div className="center-card-brand">{brand}</div>}
        
        {/* Top Title (for Islandwide) */}
        {topTitle && <div className="center-card-top-title">{topTitle}</div>}
        
        {/* Main Title */}
        <h3 className="center-card-title">
          {title} {titleHighlight && <span className="center-card-title-highlight">{titleHighlight}</span>}
        </h3>

        {/* Subtitle */}
        {subtitle && <p className="center-card-subtitle">{subtitle}</p>}

        {/* Star Rating */}
        <div className="center-card-rating">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`center-card-star ${i < rating ? 'center-card-star-filled' : ''}`}
              viewBox="0 0 24 24"
              fill={i < rating ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>

        {/* Description */}
        {description && <p className="center-card-description">{description}</p>}

        {/* Button */}
        <button className="center-card-button">
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default CenterCard;
