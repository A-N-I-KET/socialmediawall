import { useState } from 'react';
import { auth, database } from '@/integrations/firebase/client';
import { push, ref } from 'firebase/database';
import { toast } from '@/hooks/use-toast';

interface AddTweetFormProps {
  onSuccess: () => void;
}

const AddTweetForm = ({ onSuccess }: AddTweetFormProps) => {
  const [tweetUrl, setTweetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const extractTweetId = (url: string): string | null => {
    const patterns = [
      /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
      /\/status\/(\d+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tweetId = extractTweetId(tweetUrl);
    if (!tweetId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Twitter/X post URL.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("You must be logged in to post.");
      }

      const tweetsRef = ref(database, 'approved_tweets');
      await push(tweetsRef, {
        tweet_url: tweetUrl,
        tweet_id: tweetId,
        user_id: user.uid,
        created_at: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Post added to the social wall.",
      });
      setTweetUrl('');
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-300 block mb-2">
          Twitter/X Post URL
        </label>
        <input
          type="url"
          value={tweetUrl}
          onChange={(e) => setTweetUrl(e.target.value)}
          className="w-full px-4 py-2.5 bg-black border border-white/20 rounded-md text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all font-mono text-sm"
          placeholder="https://x.com/user/status/123456789"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="premium-button w-full py-2.5 mt-2"
      >
        {loading ? 'Posting...' : 'Add to Wall'}
      </button>
    </form>
  );
};

export default AddTweetForm;