import { TwitterTweetEmbed } from 'react-twitter-embed';

interface TweetCardProps {
  tweetId: string;
  index?: number;
}

const TweetCard = ({ tweetId, index = 0 }: TweetCardProps) => {
  return (
    <div 
      className="wanted-poster p-4 animate-fade-in"
      style={{ 
        animationDelay: `${index * 100}ms`,
        opacity: 0
      }}
    >
      {/* Wanted Poster Header */}
      <div className="text-center mb-3 border-b-2 border-leather pb-2">
        <h3 className="font-western text-lg text-rust tracking-widest text-shadow-western">
          DISPATCH
        </h3>
        <p className="text-xs text-muted-foreground font-body">
          FROM THE FRONTIER
        </p>
      </div>
      
      {/* Tweet Embed */}
      <div className="tweet-container">
        <TwitterTweetEmbed 
          tweetId={tweetId}
          options={{
            theme: 'light',
            align: 'center',
            width: 300,
            conversation: 'none'
          }}
          placeholder={
            <div className="flex items-center justify-center h-32 text-muted-foreground font-body">
              <div className="animate-pulse text-center">
                <p className="text-sm">Loading dispatch...</p>
                <p className="text-xs mt-1">🤠</p>
              </div>
            </div>
          }
        />
      </div>

      {/* Poster Footer */}
      <div className="text-center mt-3 pt-2 border-t border-dashed border-leather/50">
        <span className="text-[10px] text-muted-foreground font-body tracking-wide">
          ★ HACKOLUTION 2K26 ★
        </span>
      </div>
    </div>
  );
};

export default TweetCard;