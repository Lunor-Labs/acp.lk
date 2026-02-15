import { useEffect, useRef } from 'react';
import studentImage from '../../../assets/student1.png';

const Success: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let scrollAmount = 0;
        const scrollSpeed = 1;

        const autoScroll = () => {
            if (scrollContainer) {
                scrollAmount += scrollSpeed;
                scrollContainer.scrollLeft = scrollAmount;

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
        <section className="landing-section overflow-hidden" id="success">
            <div className="landing-container">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-block bg-primary/10 text-primary px-6 py-2 rounded-full font-bold text-sm mb-4">
                        2024 A/L Results
                    </div>
                    <h3 className="text-4xl lg:text-5xl font-black text-neutral-black mb-3">
                        Outstanding <span className="text-primary">Performance</span>
                    </h3>
                    <p className="text-gray text-lg">Celebrating our successful students</p>
                </div>

            </div>

            {/* Horizontal Scrolling Student Cards */}
            <div className="relative">
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-hidden py-8 px-6"
                    style={{ scrollBehavior: 'auto' }}
                >
                    {[...students, ...students].map((student, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 w-56 bg-neutral-white rounded-2xl p-6 text-center border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Student Image */}
                            <div className="relative mb-4">
                                <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors">
                                    <img
                                        src={studentImage}
                                        alt={student.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Grade Badge */}
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-dark w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-lg">
                                    {student.grade}
                                </div>
                            </div>

                            {/* Student Info */}
                            <h4 className="font-bold text-lg text-neutral-black mb-1">{student.name}</h4>
                            <p className="text-sm text-gray font-medium">{student.district}</p>
                        </div>
                    ))}
                </div>

                {/* Gradient Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-neutral-white to-transparent pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-neutral-white to-transparent pointer-events-none"></div>
            </div>

            {/* Subtle Background Decoration */}
            <div className="absolute top-20 right-10 w-32 h-32 border-2 border-primary/10 rounded-full"></div>
            <div className="absolute bottom-20 left-10 w-40 h-40 border-2 border-gray-100 rounded-full"></div>
        </section>
    );
};

export default Success;
