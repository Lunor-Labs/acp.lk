import React from 'react';
import './Footer.css';
import acpLogo from '../../../assets/logoacp.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'Facebook',
      url: '#',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    },
    {
      name: 'YouTube',
      url: '#',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      )
    },
    {
      name: 'TikTok',
      url: '#',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="tiktok icon.jpg">
          <path d="M19.321 5.562a5.122 5.122 0 0 1-.868-.074 3.078 3.078 0 0 1-2.623-3.11V.84h-3.165v12.89a2.042 2.042 0 1 1-4.078-.023V3.27H5.42v9.433a5.122 5.122 0 0 0 5.115 5.256 5.06 5.06 0 0 0 5.115-5.256v-6.39a6.495 6.495 0 0 0 3.671 1.15v-3.15a3.316 3.316 0 0 1-.87-.12z" />
        </svg>
      )
    },
    {
      name: 'Instagram',
      url: '#',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="instr icon.jpg">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03z" />
        </svg>
      )
    }
  ];

  const telegramChannels = [
    { year: '2026', category: 'A/L' },
    { year: '2027', category: 'A/L' },
    { year: '2028', category: 'A/L' }
  ];

  const contactInfo = [
    { type: 'phone', value: '071-6688994', icon: '📱' },
    { type: 'email', value: 'info@acp.lk', icon: '✉️' },
    { type: 'address', value: '95/D, Walasmulla', icon: '📍' }
  ];

  return (
    <footer className="footer-section" id="contact">
      <div className="footer-content">
        {/* Main Footer Grid */}
        <div className="footer-grid">
          {/* Left Column: Logo & Social Media */}
          <div className="footer-column footer-brand">
            <div className="footer-logo">
              <img src={acpLogo} alt="ACP Logo" className="footer-logo-img" />
              
            </div>
            <p className="footer-tagline">උසස්වත්ම විධිමාතෘකා හා විස්තරිත physics සටහන</p>

            <div className="footer-social">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="footer-social-link"
                  aria-label={social.name}
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Middle Column: Telegram Channels */}
          <div className="footer-column footer-channels">
            <h4 className="footer-column-title">Telegram Channels</h4>
            <ul className="footer-channels-list">
              {telegramChannels.map((channel, index) => (
                <li key={index} className="footer-channel-item">
                  {channel.year} {channel.category}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Contact Information */}
          <div className="footer-column footer-contact">
            <h4 className="footer-column-title">Contact Us</h4>
            <ul className="footer-contact-list">
              {contactInfo.map((info, index) => (
                <li key={index} className="footer-contact-item">
                  <span className="footer-contact-icon">{info.icon}</span>
                  <span className="footer-contact-value">{info.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Copyright Section */}
        <div className="footer-copyright">
          <p>Copyright © All Rights 2025. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;