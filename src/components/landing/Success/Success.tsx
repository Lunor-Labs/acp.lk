import React from 'react';
import './Success.css';
import studentImage from '../../../assets/student1.png';
import type { Student } from '../../../types/landing';

const Success: React.FC = () => {
  const students: Student[] = [
    { name: 'Yasith Banula', year: '2024 A/L', district: 'Gampaha District', subject: 'Physics', grade: 'A' },
    { name: 'Yasith Banula', year: '2024 A/L', district: 'Gampaha District', subject: 'Physics', grade: 'A' },
    { name: 'Yasith Banula', year: '2024 A/L', district: 'Gampaha District', subject: 'Physics', grade: 'A' },
    { name: 'Yasith Banula', year: '2024 A/L', district: 'Gampaha District', subject: 'Physics', grade: 'A' },
    { name: 'Yasith Banula', year: '2024 A/L', district: 'Gampaha District', subject: 'Physics', grade: 'A' },
    { name: 'Yasith Banula', year: '2024 A/L', district: 'Gampaha District', subject: 'Physics', grade: 'A' },
    { name: 'Yasith Banula', year: '2024 A/L', district: 'Gampaha District', subject: 'Physics', grade: 'A' },
    { name: 'Yasith Banula', year: '2024 A/L', district: 'Gampaha District', subject: 'Physics', grade: 'A' },
  ];

  return (
    <section className="success" id="success">
      {/* Decorative background elements */}
      <div className="success-bg-decoration">
        <div className="success-blob success-blob-1"></div>
        <div className="success-blob success-blob-2"></div>
        <div className="success-blob success-blob-3"></div>
      </div>

      {/* Upper White Section */}
      <div className="success-header">
        <div className="success-header-container">
          <h2 className="success-title">Our Success</h2>
          <p className="success-description">
            Celebrating the achievements of our students who have excelled in their Advanced Level examinations. 
            Join hundreds of successful students who have achieved their academic goals with us.
          </p>
        </div>
      </div>

      {/* Lower White Section with Cards */}
      <div className="success-profiles">
        <div className="success-profiles-wrapper">
          <div className="success-profiles-container">
            {[...students, ...students].map((student, index) => (
              <div key={index} className="student-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="student-card-inner">
                  <div className="student-image-wrapper">
                    <div className="student-image-glow"></div>
                    <img 
                      src={studentImage} 
                      alt={student.name}
                      className="student-profile-image"
                    />
                    <div className="student-grade-badge">{student.grade}</div>
                  </div>
                  <div className="student-info">
                    <h3 className="student-name">{student.name}</h3>
                    <p className="student-year">{student.year}</p>
                    <p className="student-district">{student.district}</p>
                    <div className="student-tag">
                      <span className="student-subject">{student.subject}</span>
                      <span className="student-grade">{student.grade}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Success;

