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
    // Match patterns like:
    // https://twitter.com/user/status/1234567890
    // https://x.com/user/status/1234567890
    // https://twitter.com/user/status/1234567890?s=20
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
        title: "Whoa there!",
        description: "That doesn't look like a valid Twitter/X link, partner.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("You need to be logged in, sheriff!");
      }

      const tweetsRef = ref(database, 'approved_tweets');
      await push(tweetsRef, {
        tweet_url: tweetUrl,
        tweet_id: tweetId,
        user_id: user.uid,
        created_at: new Date().toISOString(),
      });

      toast({
        title: "Yeehaw!",
        description: "Dispatch posted to the social wall!",
      });
      setTweetUrl('');
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Tarnation!",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="font-western text-sm text-leather block mb-2">
          Paste Twitter/X Link
        </label>
        <input
          type="url"
          value={tweetUrl}
          onChange={(e) => setTweetUrl(e.target.value)}
          className="western-input"
          placeholder="https://twitter.com/user/status/123456789"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="sheriff-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '🤠 Saddling up...' : '🐎 SADDLE UP & POST'}
      </button>
    </form>
  );
};

export default AddTweetForm;