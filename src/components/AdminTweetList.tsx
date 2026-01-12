import { Trash2 } from 'lucide-react';
import { database } from '@/integrations/firebase/client';
import { ref, remove } from 'firebase/database';
import { toast } from '@/hooks/use-toast';

interface Tweet {
  id: string;
  tweet_id: string;
  tweet_url: string;
  created_at: string;
}

interface AdminTweetListProps {
  tweets: Tweet[];
  onDelete: () => void;
}

const AdminTweetList = ({ tweets, onDelete }: AdminTweetListProps) => {
  const handleDelete = async (id: string) => {
    try {
      const tweetRef = ref(database, `approved_tweets/${id}`);
      await remove(tweetRef);

      toast({
        title: "Dispatch Removed",
        description: "That tweet has been run out of town!",
      });
      onDelete();
    } catch (error: any) {
      toast({
        title: "Tarnation!",
        description: "Failed to remove this dispatch. Try again, partner.",
        variant: "destructive",
      });
    }
  };

  if (tweets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="font-body text-muted-foreground">
          No dispatches added yet. Start posting, sheriff!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-western text-lg text-rust border-b-2 border-leather pb-2 mb-4">
        Posted Dispatches
      </h3>
      {tweets.map((tweet) => (
        <div 
          key={tweet.id} 
          className="flex items-center justify-between bg-cream/50 border border-leather/30 rounded-sm p-3 group hover:bg-cream transition-colors"
        >
          <div className="flex-1 min-w-0 mr-4">
            <p className="font-body text-sm text-foreground truncate">
              {tweet.tweet_url}
            </p>
            <p className="text-xs text-muted-foreground">
              ID: {tweet.tweet_id}
            </p>
          </div>
          <button
            onClick={() => handleDelete(tweet.id)}
            className="flex items-center justify-center w-10 h-10 bg-destructive/10 border border-destructive/30 rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:scale-110 group-hover:rotate-12"
            title="Remove dispatch"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminTweetList;