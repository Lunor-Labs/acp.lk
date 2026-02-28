import React from 'react';
import studentImage from '../../../assets/student1.webp';
import "./Success.css";

interface SuccessStudentData {
  name: string;
  subtitle: string;
  faculty: string;
  university: string;
  grade: string;
  image: string;
}

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

// Duplicate for seamless loop (same pattern as Topstudent desktop marquee)
const marqueeStudents = [...students, ...students];

const Success: React.FC = () => {
  return (
    <section className="success-section" id="success">
      <div className="success-container">
        {/* Header */}
        <div className="success-header">
          <h2 className="success-title">
            <span className="success-title-highlight">ජීවිතය</span> දිනු දිරිය <span className="success-title-highlight">දරුවන්</span>
          </h2>
        </div>
      </div>

      {/* Full-width marquee track — same approach as Topstudent desktop */}
      <div className="success-marquee-outer">
        <div className="success-marquee-track animate-scroll-horizontal hover:[animation-play-state:paused] will-change-transform">
          {marqueeStudents.map((student, index) => (
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
      </div>
    </section>
  );
};

export default Success;
