import type { TelegramChannel } from '@/types/landing';

type ChannelCardProps = Pick<TelegramChannel, 'image'>;

const ChannelCard: React.FC<ChannelCardProps> = ({ image }) => {
  return (
    <div className="channel-card-container" data-card>
      <img 
        src={image} 
        alt="Telegram Channel"
        className="channel-card-image"
        loading="lazy"
      />
    </div>
  );
};

export default ChannelCard;
