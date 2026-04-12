import React from 'react';
import './Footer.css';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import acpLogo from '@/assets/acp-logo.webp';

const FacebookIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.793-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.271h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const YoutubeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TiktokIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.77 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
  </svg>
);

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/share/1BDDM9Ua7x/',
      icon: <FacebookIcon className="w-5 h-5" />
    },
    {
      name: 'YouTube',
      url: 'https://youtube.com/@amila_c_edirimanna?si=Z1pQkH-SiuP9oIBv',
      icon: <YoutubeIcon className="w-5 h-5" />
    },
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@amilac123?_r=1&_t=ZS-94rv3RZacAJ',
      icon: <TiktokIcon className="w-5 h-5" />
    }
  ];

  const quickLinks = [
    { name: 'Home', url: '#home' },
    { name: 'Classes', url: '#channels' },
    { name: 'About', url: '#about' },
    { name: 'Contact', url: '#contact' }
  ];

  const contactInfo = [
    { type: 'phone', value: '071-6683994', icon: <Phone className="w-4 h-4" /> },
    { type: 'email', value: 'info@acp.lk', icon: <Mail className="w-4 h-4" /> },
    { type: 'address', value: '33/D, Walasmulla', icon: <MapPin className="w-4 h-4" /> }
  ];

  return (
    <footer id="contact" className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Top Section - Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12 pb-12 border-b border-slate-700">
          
          {/* Brand Column */}
          <div className="flex flex-col md:items-start items-center md:text-left text-center">
            <div className="mb-4">
              <img src={acpLogo} alt="ACP Logo" className="h-14 md:h-16 w-auto object-contain drop-shadow-lg" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Amila C Physics</h3>
            <p className="text-slate-400 text-sm mb-6">Advanced Physics Education</p>
            <div className="flex gap-3 md:justify-start justify-center">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700 text-slate-300 hover:bg-[#eb1b23] hover:text-white transition-all duration-300 hover:scale-110"
                  aria-label={social.name}
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="flex flex-col md:items-start items-center md:text-left text-center">
            <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2 md:justify-start justify-center">
              <div className="w-1 h-4 bg-gradient-to-b from-[#eb1b23] to-red-700 rounded-full"></div>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    className="text-slate-400 hover:text-white text-sm transition-colors duration-300 flex items-center gap-2 group md:justify-start justify-center"
                  >
                    <span className="inline-block w-1 h-1 bg-[#eb1b23] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information Column */}
          <div className="flex flex-col md:items-start items-center md:text-left text-center">
            <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2 md:justify-start justify-center">
              <div className="w-1 h-4 bg-gradient-to-b from-[#eb1b23] to-red-700 rounded-full"></div>
              Contact Info
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((info, index) => (
                <li key={index} className="flex gap-3 md:justify-start justify-center">
                  <div className="flex-shrink-0 w-5 h-5 text-[#eb1b23] mt-0.5">
                    {info.icon}
                  </div>
                  <span className="text-slate-400 text-sm">{info.value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Powered By Column */}
          <div className="flex flex-col md:items-start items-center md:text-left text-center">
            <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2 md:justify-start justify-center">
              <div className="w-1 h-4 bg-gradient-to-b from-[#eb1b23] to-red-700 rounded-full"></div>
              About
            </h4>
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-300 text-sm mb-3">
                Premium online classes for A/L students with expert Physics guidance and comprehensive study materials.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-3 border-t border-slate-600">
                <span>Powered by</span>
                <a 
                  href="https://www.lunorlabs.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#eb1b23] hover:text-red-400 font-semibold flex items-center gap-1 transition-colors"
                >
                  Lunorlabs
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:text-left text-center">
          <p className="text-slate-400 text-sm">
            Copyright © Amila C Physics {currentYear}. All Rights Reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 md:justify-end justify-center">
            <span>Made with</span>
            <span className="text-[#eb1b23]">♥</span>
            <span>by</span>
            <a 
              href="https://lunorlabs.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#eb1b23] hover:text-red-400 font-semibold transition-colors"
            >
              Lunorlabs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
