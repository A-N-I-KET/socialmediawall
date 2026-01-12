import TweetCard from './TweetCard';

interface Tweet {
  id: string;
  tweet_id: string;
  tweet_url: string;
  created_at: string;
}

interface MasonryGridProps {
  tweets: Tweet[];
}

const MasonryGrid = ({ tweets }: MasonryGridProps) => {
  if (tweets.length === 0) {
    return (
      <div className="wanted-poster max-w-md mx-auto p-8 text-center">
        <h3 className="font-western text-2xl text-rust mb-4 text-shadow-western">
          NO DISPATCHES YET
        </h3>
        <p className="font-body text-muted-foreground">
          The telegraph wires are quiet, partner. Check back soon for updates from the frontier.
        </p>
        <div className="mt-6 text-4xl">🌵</div>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {tweets.map((tweet, index) => (
        <div key={tweet.id} className="break-inside-avoid">
          <TweetCard tweetId={tweet.tweet_id} index={index} />
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;