import type { TelegramChannel } from '../../../types/landing';
import ChannelCard from './ChannelCard';
import "./Channels.css";

// Import images for Vite bundling
import twenty26theory from '@/assets/2026theory.webp';
import twenty27theory from '@/assets/2027theory.webp';
import twenty28theory from '@/assets/2028theory.webp';
import telegramIconImg from '@/assets/telegram_imag-removebg-preview.webp';

const Channels: React.FC = () => {
  const channels: TelegramChannel[] = [
    {
      year: '2026',
      category: 'THEORY',
      buttonText: 'Join Now',
      joinLink: 'https://t.me/+OzupmFyuZb9mYjU1',
      image: twenty26theory
    },
    {
      year: '2027',
      category: 'THEORY',
      buttonText: 'Join Now',
      joinLink: 'https://t.me/physics2027amilac',
      image: twenty27theory
    },
    {
      year: '2028',
      category: 'THEORY',
      buttonText: 'Join Now',
      joinLink: 'https://t.me/physics2028amilac',
      image: twenty28theory
    }
  ];

  return (
    <section className="channels-section" id="channels">
      <div className="channels-container">
        <div className="channels-header">
          <h2 className="channels-title">
            Our <span className="channels-telegram-text">Telegram</span> Channels
            <img
              className="channels-telegram-icon"
              src={telegramIconImg}
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
