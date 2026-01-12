import { useState } from 'react';
import { auth } from '@/integrations/firebase/client';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

interface AuthFormProps {
  onSuccess: () => void;
}

const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back, Sheriff!",
        description: "You're now logged in to the office.",
      });
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Hold up there, partner!",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wanted-poster max-w-md mx-auto p-8">
      <div className="text-center mb-6">
        <h2 className="font-western text-2xl text-rust text-shadow-western">
          SHERIFF'S OFFICE
        </h2>
        <p className="font-body text-sm text-muted-foreground mt-2">
          Show your badge to enter
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-western text-sm text-leather block mb-2">
            Telegraph Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="western-input"
            placeholder="sheriff@frontier.com"
            required
          />
        </div>

        <div>
          <label className="font-western text-sm text-leather block mb-2">
            Secret Code
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="western-input"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="sheriff-button w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Checking papers...' : 'Enter Office'}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
