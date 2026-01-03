import React, { useState } from 'react';
import './Topstudent.css';
import studentImage from '../../../assets/student1.png';
import type { TopStudent } from '../../../types/landing';

const Topstudent: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('2026 A/L Physics');

  const allStudents: TopStudent[] = [
    { rank: 1, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 2, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 3, name: 'Yasith Banula', school: 'Sri Sumangala Maha Vidyalaya', marks: 60, image: studentImage },
    { rank: 4, name: 'Yasith Banula', school: '', marks: 60, image: studentImage },
    { rank: 5, name: 'Yasith Banula', school: '', marks: 60, image: studentImage },
    { rank: 6, name: 'Yasith Banula', school: '', marks: 60, image: studentImage },
    { rank: 7, name: 'Yasith Banula', school: '', marks: 60, image: studentImage },
    { rank: 8, name: 'Yasith Banula', school: '', marks: 60, image: studentImage },
    { rank: 9, name: 'Yasith Banula', school: '', marks: 60, image: studentImage },
    { rank: 10, name: 'Yasith Banula', school: '', marks: 60, image: studentImage },
  ];

  const filters = ['2026 A/L Physics', '2026 A/L Physics', '2026 A/L Physics'];

  return (
    <section className="topstudent" id="top10">
      {/* Header Section */}
      <div className="topstudent-header">
        <div className="topstudent-header-container">
          <h2 className="topstudent-title">Paper Class Top 10 Student List</h2>
          <p className="topstudent-description">
            Ornare id fames interdum porttitor nulla turpis etiam. Diam vitae sollicitudin at nec nam et pharetra gravida. Adipiscing a quis ultrices eu ornare tristique vel nisl orci.
          </p>
          
          {/* Filter Buttons */}
          <div className="filter-buttons">
            {filters.map((filter, index) => (
              <button
                key={index}
                className={`filter-btn ${activeFilter === filter && index === filters.length - 1 ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student List Section */}
      <div className="topstudent-list">
        <div className="topstudent-container">
          {/* All Students in Single Horizontal Line */}
          <div className="all-students">
            {/* Original set */}
            {allStudents.map((student) => (
              <div key={student.rank} className="student-card">
                <div className="card-content">
                  <div className="student-image-wrapper">
                    <img
                      src={student.image || studentImage}
                      alt={student.name}
                      className="student-profile-image"
                    />
                  </div>
                  <div className="card-text">
                    <h4 className="student-name">{student.name}</h4>
                    <p className="student-school">{student.school}</p>
                    <p className="student-marks">Marks {student.marks}</p>
                    <p className="student-rank">Rank {String(student.rank).padStart(2, '0')}</p>
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicated set for seamless scrolling */}
            {allStudents.map((student) => (
              <div key={`duplicate-${student.rank}`} className="student-card">
                <div className="card-content">
                  <div className="student-image-wrapper">
                    <img
                      src={student.image || studentImage}
                      alt={student.name}
                      className="student-profile-image"
                    />
                  </div>
                  <div className="card-text">
                    <h4 className="student-name">{student.name}</h4>
                    <p className="student-school">{student.school}</p>
                    <p className="student-marks">Marks {student.marks}</p>
                    <p className="student-rank">Rank {String(student.rank).padStart(2, '0')}</p>
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

export default Topstudent;

