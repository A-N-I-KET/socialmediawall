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
        title: "Post Removed",
        description: "The post was successfully removed from the wall.",
      });
      onDelete();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove post.';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (tweets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">
          No dispatches yet. Start posting above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-400 border-b border-white/10 pb-3 mb-4 uppercase tracking-wider">
        Active Dispatches
      </h3>
      <div className="space-y-2">
        {tweets.map((tweet) => (
          <div 
            key={tweet.id} 
            className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-md p-3 group hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm text-gray-200 truncate font-mono">
                {tweet.tweet_url}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ID: {tweet.tweet_id}
              </p>
            </div>
            <button
              onClick={() => handleDelete(tweet.id)}
              className="flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-all duration-200"
              title="Remove dispatch"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTweetList;