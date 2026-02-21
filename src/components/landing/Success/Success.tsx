import React, { useState, useRef } from 'react';
import studentImage from '../../../assets/student1.png';
import "./Success.css";

interface SuccessStudentData {
  name: string;
  subtitle: string;
  faculty: string;
  university: string;
  grade: string;
  image: string;
}

const Success: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const students: SuccessStudentData[] = [
    {
      name: 'Yasas Ravihara',
      subtitle: 'GAMPAHA',
      faculty: 'Faculty of Engineering',
      university: 'University of Moratuwa',
      grade: 'AAA',
      image: studentImage
    },
    {
      name: 'Malki Wihara',
      subtitle: 'GAMPAHA',
      faculty: 'Faculty of Engineering',
      university: 'University of Moratuwa',
      grade: 'AAA',
      image: studentImage
    },
    {
      name: 'Himasara Sayuranga',
      subtitle: 'GAMPAHA',
      faculty: 'Faculty of Engineering',
      university: 'University of Moratuwa',
      grade: 'AAA',
      image: studentImage
    },
    {
      name: 'Sathsara Perera',
      subtitle: 'GAMPAHA',
      faculty: 'Faculty of Science',
      university: 'University of Colombo',
      grade: 'AAA',
      image: studentImage
    },
    {
      name: 'Kavindi Silva',
      subtitle: 'GAMPAHA',
      faculty: 'Faculty of Medicine',
      university: 'University of Peradeniya',
      grade: 'AAA',
      image: studentImage
    },
    {
      name: 'Nethmi Fernando',
      subtitle: 'GAMPAHA',
      faculty: 'Faculty of Engineering',
      university: 'University of Ruhuna',
      grade: 'AAA',
      image: studentImage
    }
  ];

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : students.length - 3));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev < students.length - 3 ? prev + 1 : 0));
  };

  const visibleStudents = students.slice(currentSlide, currentSlide + 3);

  return (
    <section className="success-section" id="success">
      <div className="success-container">
        {/* Header */}
        <div className="success-header">
          <h2 className="success-title">
            <span className="success-title-highlight">ජීවිතය</span> දිනු දිරිය <span className="success-title-highlight">දරුවන්</span>
          </h2>
        </div>

        {/* Carousel Wrapper */}
        <div className="success-carousel-wrapper">
          {/* Previous Button */}
          <button
            className="success-nav-button success-nav-button-left"
            onClick={handlePrevious}
            aria-label="Previous students"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Student Grid */}
          <div ref={scrollContainerRef} className="success-grid">
            {visibleStudents.map((student, index) => (
              <div key={index} className="success-card">
                {/* Image with Badge */}
                <div className="success-image-wrapper">
                  <div className="success-image-container">
                    <img
                      src={student.image}
                      alt={student.name}
                      className="success-image"
                      loading="lazy"
                    />
                  </div>
                  <div className="success-badge">{student.grade}</div>
                </div>

                {/* Student Info */}
                <div className="success-info">
                  <p className="success-subtitle">{student.subtitle}</p>
                  <h3 className="success-name">{student.name}</h3>
                  <p className="success-faculty">{student.faculty}</p>
                  <p className="success-university">{student.university}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Next Button */}
          <button
            className="success-nav-button success-nav-button-right"
            onClick={handleNext}
            aria-label="Next students"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Success;
