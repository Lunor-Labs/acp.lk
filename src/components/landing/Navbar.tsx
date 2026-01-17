import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  onLoginRequest?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginRequest }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Scroll spy
      const sections = ['home', 'success', 'centers', 'process', 'top10', 'gallery', 'reviews', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'success', label: 'Success' },
    { id: 'centers', label: 'Centers' },
    { id: 'process', label: 'Process' },
    { id: 'top10', label: 'Top 10' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-dark shadow-2xl' : 'bg-dark/95 backdrop-blur-sm'
      }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-primary px-4 py-2 rounded-lg">
                <span className="text-dark font-black text-2xl">AL</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-neutral-white font-bold text-xl leading-tight">Physics</span>
              <span className="text-gray text-xs font-medium">Online Tuition</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`text-sm font-semibold transition-all relative group ${activeSection === link.id
                  ? 'text-primary'
                  : 'text-neutral-white hover:text-primary'
                  }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"></span>
                )}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            {!user && (
              <button
                onClick={onLoginRequest}
                className="relative group bg-primary hover:bg-primary-500 text-dark font-bold px-8 py-3 rounded-lg transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-0.5"
              >
                <span className="relative z-10">Student Portal</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 bg-neutral-white transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-neutral-white transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-neutral-white transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-neutral-gray-800 pt-4">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`text-left py-2 px-4 rounded-lg font-semibold transition-colors ${activeSection === link.id
                    ? 'bg-primary text-dark'
                    : 'text-neutral-white hover:bg-dark-50'
                    }`}
                >
                  {link.label}
                </button>
              ))}
              {!user && (
                <button
                  onClick={onLoginRequest}
                  className="bg-primary hover:bg-primary-500 text-dark font-bold px-6 py-3 rounded-lg mt-2"
                >
                  Student Portal
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
