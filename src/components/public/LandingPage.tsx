import { GraduationCap, Users, BookOpen, Star } from 'lucide-react';

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-teal-500" />
            <span className="text-2xl font-bold text-gray-800">AL Tuition</span>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Excellence in Advanced Level Education
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of students achieving their dreams through quality online tuition
        </p>
        <button
          onClick={onGetStarted}
          className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg hover:shadow-xl"
        >
          Start Learning Today
        </button>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Us?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition">
              <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Expert Teachers</h3>
              <p className="text-gray-600">
                Learn from experienced educators with proven track records
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Comprehensive Materials</h3>
              <p className="text-gray-600">
                Access study packs, videos, and practice exams anytime
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition">
              <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Proven Results</h3>
              <p className="text-gray-600">
                Join our top performers and achieve excellence in your exams
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 AL Tuition Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
