import React, { useState, useRef } from 'react';
import studentImage from '../../../assets/student1.png';
import "./Topstudent.css";

interface TopStudentData {
  name: string;
  subtitle: string;
  faculty: string;
  university: string;
  grade: string;
  image: string;
}

const Topstudent: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const students: TopStudentData[] = [
    {
      name: 'Yasas Ravihara',
      subtitle: 'කණිෂ්ඨ',
      faculty: 'Faculty of Engineering',
      university: 'University of Moratuwa',
      grade: 'AAA',
      image: studentImage
    },
    {
      name: 'Malki Wihara',
      subtitle: 'කණිෂ්ඨ',
      faculty: 'Faculty of Engineering',
      university: 'University of Moratuwa',
      grade: 'AAA',
      image: studentImage
    },
    {
      name: 'Himasara Sayuranga',
      subtitle: 'කණිෂ්ඨ',
      faculty: 'Faculty of Engineering',
      university: 'University of Moratuwa',
      grade: 'AAA',
      image: studentImage
    },
    {
      name: 'Sathsara Perera',
      subtitle: 'කණිෂ්ඨ',
      faculty: 'Faculty of Science',
      university: 'University of Colombo',
      grade: 'AAA',
      image: studentImage
    },
    {
      name: 'Kavindi Silva',
      subtitle: 'කණිෂ්ඨ',
      faculty: 'Faculty of Medicine',
      university: 'University of Peradeniya',
      grade: 'AAA',
      image: studentImage
    },
    {
      name: 'Nethmi Fernando',
      subtitle: 'කණිෂ්ඨ',
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
    <section className="topstudent-section" id="topstudents">
      <div className="topstudent-container">
        {/* Header */}
        <div className="topstudent-header">
          <h2 className="topstudent-title">
            පීවිකය <span className="topstudent-title-highlight">දිනු දිරිය</span> දරුවන්
          </h2>
        </div>

        {/* Carousel Wrapper */}
        <div className="topstudent-carousel-wrapper">
          {/* Previous Button */}
          <button
            className="topstudent-nav-button topstudent-nav-button-left"
            onClick={handlePrevious}
            aria-label="Previous students"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Student Grid */}
          <div ref={scrollContainerRef} className="topstudent-grid">
            {visibleStudents.map((student, index) => (
              <div key={index} className="topstudent-card">
                {/* Image with Badge */}
                <div className="topstudent-image-wrapper">
                  <div className="topstudent-image-container">
                    <img
                      src={student.image}
                      alt={student.name}
                      className="topstudent-image"
                      loading="lazy"
                    />
                  </div>
                  <div className="topstudent-badge">{student.grade}</div>
                </div>

                {/* Student Info */}
                <div className="topstudent-info">
                  <p className="topstudent-subtitle">{student.subtitle}</p>
                  <h3 className="topstudent-name">{student.name}</h3>
                  <p className="topstudent-faculty">{student.faculty}</p>
                  <p className="topstudent-university">{student.university}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Next Button */}
          <button
            className="topstudent-nav-button topstudent-nav-button-right"
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

export default Topstudent;


