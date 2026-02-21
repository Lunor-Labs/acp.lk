import type { TelegramChannel } from '../../../types/landing';

interface ChannelCardProps extends TelegramChannel {}

const ChannelCard: React.FC<ChannelCardProps> = ({
  year,
  category,
  image
}) => {
  return (
    <div className="channel-card-container" data-card>
      <img 
        src={image} 
        alt={`${year} ${category} Channel`}
        className="channel-card-image"
        loading="lazy"
      />
      
      <div className="channel-card-content">
        <div className="channel-card-year">{year}</div>
        <div className="channel-card-category">{category}</div>
      </div>
    </div>
  );
};

export default ChannelCard;
