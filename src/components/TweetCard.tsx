import { TwitterTweetEmbed } from 'react-twitter-embed';

interface TweetCardProps {
  tweetId: string;
  index?: number;
}

const TweetCard = ({ tweetId, index = 0 }: TweetCardProps) => {
  return (
    <div 
      className="glass-panel p-4 animate-fade-in"
      style={{ 
        animationDelay: `${index * 100}ms`,
        opacity: 0
      }}
    >
      <div className="tweet-container">
        <TwitterTweetEmbed 
          tweetId={tweetId}
          options={{
            theme: 'dark',
            align: 'center',
            width: 300,
            conversation: 'none'
          }}
          placeholder={
            <div className="flex items-center justify-center h-48 text-gray-500 font-sans">
              <div className="animate-pulse text-center">
                <p className="text-sm">Loading...</p>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default TweetCard;