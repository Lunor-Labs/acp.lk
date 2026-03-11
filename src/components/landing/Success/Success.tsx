import React, { useEffect, useState } from 'react';
import { successRepository, FormattedSuccessStudent } from '../../../repositories/SuccessRepository';
import "./Success.css";

const Success: React.FC = () => {
  const [students, setStudents] = useState<FormattedSuccessStudent[]>([]);
  const [marqueeStudents, setMarqueeStudents] = useState<FormattedSuccessStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // console.log('🔄 Fetching success students...');
        const fetchedStudents = await successRepository.getSuccessStudents();
        // console.log('✅ Fetched students:', fetchedStudents);
        // console.log('📊 Total students:', fetchedStudents.length);
        
        setStudents(fetchedStudents);
        // Duplicate for seamless loop
        setMarqueeStudents([...fetchedStudents, ...fetchedStudents]);
        setError(null);
      } catch (err) {
        // console.error('❌ Failed to fetch success students:', err);
        // const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        // console.error('📋 Error details:', errorMsg);
        // setError(`Failed to load success stories: ${errorMsg}`);
        // Show at least an empty state
        setMarqueeStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

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

      {/* Loading state */}
      {loading && (
        <div className="success-marquee-outer">
          <div className="success-loading-message">Loading success stories...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="success-marquee-outer">
          <div className="success-error-message">
            {/* <div>⚠️ {error}</div> */}
            {/* <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
              Check browser console (F12) for detailed error information.
            </div> */}
          </div>
        </div>
      )}

      {/* Full-width marquee track — same approach as Topstudent desktop */}
      {!loading && marqueeStudents.length > 0 && (
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
                  <p className="success-subtitle">Index.No :{student.subtitle}</p>
                  <h3 className="success-name">{student.name}</h3>
                  <p className="success-faculty">{student.faculty}</p>
                  <p className="success-university">{student.university}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && marqueeStudents.length === 0 && (
        <div className="success-marquee-outer">
          <div className="success-empty-message">No success stories available yet.</div>
        </div>
      )}
    </section>
  );
};

export default Success;
