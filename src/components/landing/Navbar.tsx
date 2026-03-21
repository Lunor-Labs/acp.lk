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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-[#eb1b23]/95 backdrop-blur-md shadow-2xl'
        : 'bg-gradient-to-b from-black/40 to-transparent'
        } w-full`}
    >
      <div className="max-w-screen-2xl mx-auto w-full">
        <div className="flex items-center justify-between h-16 lg:h-20 px-4 lg:px-0 relative">
          {/* Mobile Menu Button - Left */}
          <div className="lg:hidden flex-1 flex justify-start z-10">
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
            className="flex items-center justify-center lg:px-4 xl:px-8 cursor-pointer bg-transparent h-full min-w-[100px] lg:min-w-[180px] xl:min-w-[240px] z-10 flex-shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src={isScrolled ? acpLogoWhite : acpLogo}
              alt="ACP Logo"
              className="h-12 lg:h-16 w-auto object-contain drop-shadow-xl transform origin-center"
            />
          </div>

          <div className="hidden lg:flex items-center h-full lg:flex-1 z-10">
            {/* Desktop Navigation links — flex-1 each so they fill all available space evenly */}
            <div className="flex flex-1 items-center h-full">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`flex-1 h-full text-sm font-bold tracking-wide transition-all flex items-center justify-center whitespace-nowrap ${activeSection === link.id
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                    }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
            {user ? (
              <button
                onClick={onLoginRequest}
                className="mx-4 bg-white text-black font-bold px-4 xl:px-6 py-1.5 rounded-full shadow-lg transition-all duration-200 hover:bg-gray-100 text-sm whitespace-nowrap flex-shrink-0"
              >
                Go to Portal
              </button>
            ) : (
              <button
                onClick={onLoginRequest}
                className="mx-4 bg-white text-black font-bold px-4 xl:px-6 py-1.5 rounded-full shadow-lg transition-all duration-200 hover:bg-gray-100 text-sm whitespace-nowrap flex-shrink-0"
              >
                Student Portal
              </button>
            )}
          </div>

          {/* Mobile CTA only */}
          <div className="flex-1 lg:hidden flex items-center justify-end z-10">
            {user ? (
              <button
                onClick={onLoginRequest}
                className="bg-white text-black font-bold px-4 py-2 rounded-full shadow-lg transition-all duration-200 hover:bg-gray-100 text-xs sm:text-sm whitespace-nowrap"
              >
                Portal
              </button>
            ) : (
              <button
                onClick={onLoginRequest}
                className="bg-white text-black font-bold px-4 py-2 rounded-full shadow-lg transition-all duration-200 hover:bg-gray-100 text-xs sm:text-sm whitespace-nowrap"
              >
                Portal
              </button>
            )}
          </div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden border-t border-white/20 shadow-xl ${isScrolled ? 'bg-[#eb1b23]' : 'bg-black/80 backdrop-blur-md'}`}>
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
