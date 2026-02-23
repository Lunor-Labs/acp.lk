import React from 'react';
import './Centers.css';
import islandwideImg from '../../../assets/clz-banner.jpg';
import visionImg from '../../../assets/second-slider-second.jpg';
import riochemImg from '../../../assets/visionwalasmulla.png';

const Centers: React.FC = () => {
  return (
    <section className="centers-section" id="centers">
      <div className="centers-container">
        {/* Header */}
        <div className="centers-header">
          <h2 className="centers-title">
            Our <span className="centers-class-text">Class</span> Centers
          </h2>
        </div>

        {/* Centers Grid */}
        <div className="centers-grid">
          {/* Left - Islandwide Online Card */}
          <div className="center-card center-card-large">
            <img src={islandwideImg} alt="Islandwide Online" className="center-card-bg" />
            
          </div>

          {/* Right Column - Two Stacked Cards */}
          <div className="center-cards-column">
            {/* Vision Institute Card */}
            <div className="center-card center-card-small">
              <img src={visionImg} alt="Vision Institute" className="center-card-bg" />
              <div className="center-card-content">
                <div className="center-card-inner">
                  
                  
                </div>
              </div>
            </div>

            {/* Riochem Institute Card */}
            <div className="center-card center-card-small">
              <img src={riochemImg} alt="Riochem Institute" className="center-card-bg" />
              <div className="center-card-content">
                <div className="center-card-inner">
                  <div className="center-info-block">
                    

                    
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};



export default Centers;
