import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import acpLogo from '../../assets/acp-logo.webp';
import acpLogoWhite from '../../assets/acp-logo-white.webp';

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

      // Force Home active when at the very top
      if (window.scrollY < 50) {
        setActiveSection('home');
        return;
      }

      // Scroll spy
      const sections = ['success', 'teacher', 'centers', 'reviews', 'gallery', 'top10', 'channels', 'contact'];
      const scrollPosition = window.scrollY + 100;

      // Check home section first (special handling for responsive)
      const homeElement = document.getElementById(window.innerWidth >= 768 ? 'home-desktop' : 'home-mobile');
      if (homeElement) {
        const { offsetTop, offsetHeight } = homeElement;
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          setActiveSection('home');
          return;
        }
      }

      // Check other sections
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          // Only consider elements that have an actual height (visible)
          if (offsetHeight > 0 && scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
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
    let element: HTMLElement | null = null;
    
    // Special handling for home section to support responsive design
    if (id === 'home') {
      element = document.getElementById(window.innerWidth >= 768 ? 'home-desktop' : 'home-mobile');
    } else {
      element = document.getElementById(id);
    }
    
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-dark-900/95 backdrop-blur-lg shadow-lg border-b border-red-500/20'
        : 'bg-gradient-to-b from-dark-900/80 to-transparent'
        } w-full`}
    >
      <div className="max-w-screen-2xl mx-auto w-full">
        <div className="flex items-center justify-between h-16 lg:h-20 px-4 lg:px-8 relative">
          {/* Mobile Menu Button - Left */}
          <div className="lg:hidden flex-1 flex justify-start z-10">
            <button
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="space-y-1.5">
                <span className="block w-6 h-0.5 bg-white"></span>
                <span className="block w-6 h-0.5 bg-white"></span>
                <span className="block w-6 h-0.5 bg-white"></span>
              </div>
            </button>
          </div>

          {/* Logo/Brand Section - Centered on Mobile */}
          <div
            className="flex items-center justify-center lg:px-4 xl:px-8 cursor-pointer bg-transparent h-full min-w-[100px] lg:min-w-[180px] xl:min-w-[240px] z-10 flex-shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src={isScrolled ? acpLogoWhite : acpLogo}
              alt="ACP Logo"
              className="h-12 lg:h-16 w-auto object-contain drop-shadow-xl transform origin-center"
            />
          </div>

          <div className="hidden lg:flex items-center justify-center flex-1 z-10">
            {/* Desktop Navigation links */}
            <div className="flex items-center gap-8 ml-[16rem]">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`relative text-white text-sm font-medium transition-colors hover:text-red-400
                    ${activeSection === link.id ? 'text-red-400' : ''}
                  `}
                >
                  {link.label}
                  {activeSection === link.id && (
                    <span className="absolute bottom-[-8px] left-0 w-full h-0.5 bg-red-400 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Button Section */}
          <div className="hidden lg:flex items-center z-10 mr-[-3rem]">
            {user ? (
              <button
                onClick={onLoginRequest}
                className="border border-white text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white hover:text-dark-900"
              >
                Go to Portal
              </button>
            ) : (
              <button
                onClick={onLoginRequest}
                className="border border-white text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white hover:text-dark-900"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile CTA only */}
          <div className="flex-1 lg:hidden flex items-center justify-end z-10">
            {user ? (
              <button
                onClick={onLoginRequest}
                className="border border-white text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 hover:bg-white hover:text-dark-900"
              >
                Portal
              </button>
            ) : (
              <button
                onClick={onLoginRequest}
                className="border border-white text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 hover:bg-white hover:text-dark-900"
              >
                Login
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden border-t border-white/20 ${isScrolled ? 'bg-dark-900/95' : 'bg-dark-900/80'}`}>
            <div className="flex flex-col py-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`text-left py-3 px-8 font-medium transition-colors ${activeSection === link.id
                    ? 'text-red-400'
                    : 'text-white hover:text-red-400'
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
