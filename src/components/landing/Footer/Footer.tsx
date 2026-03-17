import React from 'react';
import './Footer.css';
import { Facebook, Youtube, Instagram, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'Facebook',
      url: '#',
      icon: <Facebook className="w-5 h-5" />
    },
    {
      name: 'YouTube',
      url: '#',
      icon: <Youtube className="w-5 h-5" />
    },
    {
      name: 'Instagram',
      url: '#',
      icon: <Instagram className="w-5 h-5" />
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#eb1b23] to-red-700 shadow-lg shadow-red-500/30">
                <span className="text-xl font-bold text-white">ACP</span>
              </div>
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
