import React from 'react';

type AwardCardProps = {
  name: string;
  school: string;
  award: string;
  subject: string;
  score: string;
  image: string;
  review?: string;
};

const AwardCard: React.FC<AwardCardProps> = ({
  name,
  school,
  award,
  subject,
  score,
  image,
  review,
}) => {
  const renderStars = (count: number = 5) => {
    return Array.from({ length: count }).map((_, i) => (
      <span key={i} className="text-primary text-lg">★</span>
    ));
  };

  return (
    <div className="success-card">
      {/* Avatar Section */}
      <div className="success-card-avatar-wrapper">
        <div className="success-card-avatar">
          <img src={image} alt={name} className="success-card-avatar-image" />
        </div>
      </div>

      {/* Content Section */}
      <div className="success-card-content">
        {/* Name */}
        <h4 className="success-card-name">{name}</h4>
        
        {/* School */}
        <p className="success-card-school">{school}</p>

        {/* Review/Description */}
        {review && (
          <p className="success-card-review">
            {review}
          </p>
        )}

        {/* Star Rating */}
        <div className="success-card-rating">
          {renderStars(5)}
        </div>
      </div>
    </div>
  );
};

export default AwardCard;
