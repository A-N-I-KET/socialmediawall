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
        title: "Welcome back",
        description: "You have successfully logged in as admin.",
      });
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel max-w-md mx-auto p-8 md:p-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Admin Sign In
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          Enter your credentials to manage the wall
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-black border border-white/20 rounded-md text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all text-sm"
            placeholder="admin@zerotoagent.com"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-black border border-white/20 rounded-md text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all text-sm"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="premium-button w-full py-2.5 mt-4"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
