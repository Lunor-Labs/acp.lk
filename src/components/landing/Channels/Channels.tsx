import type { TelegramChannel } from '../../../types/landing';
import ChannelCard from './ChannelCard';
import "./Channels.css";

const Channels: React.FC = () => {
  const channels: TelegramChannel[] = [
    {
      year: '2026',
      category: 'THEORY',
      buttonText: 'Join Now',
      joinLink: '#',
      image: '/src/assets/new-tution-telegram.jpg'
    },
    {
      year: '2027',
      category: 'THEORY',
      buttonText: 'Join Now',
      joinLink: '#',
      image: '/src/assets/new-tution-telegram.jpg'
    },
    {
      year: '2028',
      category: 'THEORY',
      buttonText: 'Join Now',
      joinLink: '#',
      image: '/src/assets/new-tution-telegram.jpg'
    }
  ];

  return (
    <section className="channels-section">
      <div className="channels-container">
        <div className="channels-header">
          <h2 className="channels-title">
            Our <span className="channels-telegram-text">Telegram</span> Channels
            <img
              className="channels-telegram-icon"
              src="/src/assets/telegram_imag-removebg-preview.png"
              alt="Telegram"
              loading="lazy"
            />
          </h2>
        </div>

        <div className="channels-grid">
          {channels.map((channel, index) => (
            <div key={index} className="channel-item">
              <ChannelCard {...channel} />
              <button 
                onClick={() => window.open(channel.joinLink, '_blank')}
                className="channel-button"
                aria-label={`Join ${channel.year} ${channel.category} channel`}
              >
                {channel.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Channels;
