import React, { useEffect, useRef } from 'react';
import studentImage from '../../../assets/student1.png';

const Success: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let scrollAmount = 0;
        const scrollSpeed = 1; // pixels per frame

        const autoScroll = () => {
            if (scrollContainer) {
                scrollAmount += scrollSpeed;
                scrollContainer.scrollLeft = scrollAmount;

                // Reset scroll when reaching the end
                if (scrollAmount >= scrollContainer.scrollWidth / 2) {
                    scrollAmount = 0;
                }
            }
        };

        const intervalId = setInterval(autoScroll, 30);

        return () => clearInterval(intervalId);
    }, []);

    const students = Array(20).fill({
        name: 'Yasith Banula',
        district: 'Gampaha',
        grade: 'A'
    });

    return (
        <section className="relative bg-neutral-white py-24 overflow-hidden" id="success">
            <div className="max-w-7xl mx-auto px-6">

                {/* 2024 Results Header */}
                <div className="text-center mb-10">
                    <div className="inline-block bg-primary text-neutral-white px-6 py-3 rounded-full font-black text-xl mb-4">
                        2024 A/L Results
                    </div>
                    <h3 className="text-4xl lg:text-5xl font-black text-neutral-black mb-2">
                        Outstanding <span className="text-primary">Performance</span>
                    </h3>
                    <p className="text-neutral-gray-600 text-lg">Scroll to see all our successful students</p>
                </div>

            </div>

            {/* Horizontal Scrolling Student Cards */}
            <div className="relative">
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-hidden py-8 px-6"
                    style={{ scrollBehavior: 'auto' }}
                >
                    {/* Duplicate the array for infinite scroll effect */}
                    {[...students, ...students].map((student, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 w-48 bg-neutral-white rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-primary"
                        >
                            {/* Student Image */}
                            <div className="relative mb-4">
                                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-primary">
                                    <img
                                        src={studentImage}
                                        alt={student.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Grade Badge */}
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-neutral-white w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-lg">
                                    {student.grade}
                                </div>
                            </div>

                            {/* Student Info */}
                            <h4 className="font-bold text-base text-neutral-black mb-1">{student.name}</h4>
                            <p className="text-sm text-primary font-semibold">{student.district}</p>
                        </div>
                    ))}
                </div>

                {/* Gradient Overlays for fade effect */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-neutral-white to-transparent pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-neutral-white to-transparent pointer-events-none"></div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-12">
                <button className="bg-primary hover:bg-primary-600 text-neutral-white font-black text-lg px-12 py-5 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    View All Success Stories →
                </button>
            </div>

            {/* Background Pattern */}
            <div className="absolute top-20 right-10 w-32 h-32 border-8 border-primary/10 rounded-full"></div>
            <div className="absolute bottom-20 left-10 w-40 h-40 border-8 border-primary/10 rounded-full"></div>
        </section>
    );
};

export default Success;
