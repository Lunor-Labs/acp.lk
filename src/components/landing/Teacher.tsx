import React from 'react';
import './Teacher.css';

const Teacher: React.FC = () => {
  return (
    <section className="teacher-section" id="teacher">
      <div className="teacher-container">
        <div className="teacher-header">
          <h2 className="teacher-title">Meet Our Expert Teacher</h2>
          <p className="teacher-description">
            Learn from experienced educators dedicated to your success
          </p>
        </div>

        <div className="teacher-content">
          <div className="teacher-card">
            <div className="teacher-image-wrapper">
              <div className="teacher-image-placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#4fd1c5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#4fd1c5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="teacher-info">
              <h3 className="teacher-name">අමිල සී.එදිරිමාන්න</h3>
              <p className="teacher-subject">Physics Teacher</p>
              <p className="teacher-bio">
                Experienced Advanced Level Physics teacher with a proven track record of excellent results. 
                Dedicated to helping students achieve their academic goals through comprehensive teaching methods.
              </p>
              <div className="teacher-stats">
                <div className="stat-item">
                  <span className="stat-value">10+</span>
                  <span className="stat-label">Years Experience</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">500+</span>
                  <span className="stat-label">Students</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">95%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Teacher;

