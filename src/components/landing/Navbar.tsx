import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import acpLogo from '../../assets/acp-logo.webp';

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
      const sections = ['home', 'success', 'teacher', 'centers', 'reviews', 'gallery', 'top10', 'channels', 'contact'];
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
    { id: 'success', label: 'Our Success' },
    { id: 'teacher', label: 'Teacher' },
    { id: 'centers', label: 'Centers' },
    { id: 'reviews', label: 'Student Reviews' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'top10', label: 'Top 10' },
    { id: 'channels', label: 'Channels' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-2xl' : ''} bg-[#eb1b23]`}
    >
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between h-16 lg:h-28 px-4 lg:px-0 relative">
          {/* Mobile Menu Button - Left */}
          <div className="lg:hidden flex-shrink-0 z-10">
            <button
              className="flex flex-col gap-1.5 p-1 bg-transparent"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`w-7 h-0.5 bg-white transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-7 h-0.5 bg-white transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-7 h-0.5 bg-white transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>

          {/* Logo/Brand Section - Centered on Mobile */}
          <div
            className="absolute left-1/2 -translate-x-1/2 lg:static lg:transform-none flex items-center justify-center lg:px-8 cursor-pointer bg-transparent lg:bg-[#8b0e11] h-full min-w-[120px] lg:min-w-[240px] z-10"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src={acpLogo}
              alt="ACP Logo"
              className="h-20 lg:h-27 w-auto object-contain drop-shadow-xl scale-[1.25] lg:scale-110 transform origin-center"
            />
          </div>

          <div className="flex items-center justify-end lg:justify-between lg:flex-1 h-full lg:pr-8 z-10">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center h-full">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`h-full px-6 text-sm lg:text-base font-bold tracking-wide transition-all flex items-center ${activeSection === link.id
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                    }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* CTA Button and Mobile Menu */}
            <div className="flex items-center">
              {!user && (
                <button
                  onClick={onLoginRequest}
                  className="bg-white text-black font-bold px-5 lg:px-8 py-2 lg:py-3 rounded-full shadow-lg transition-all duration-200 hover:bg-gray-100 text-sm lg:text-sm whitespace-nowrap"
                >
                  Register
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 bg-[#eb1b23] shadow-xl">
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`text-left py-4 px-8 font-bold transition-colors ${activeSection === link.id
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                    }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
