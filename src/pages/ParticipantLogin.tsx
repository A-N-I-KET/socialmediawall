import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getParticipantByEmail, setParticipantPassword } from '@/utils/firestoreHelpers';
import { hashPassword } from '@/utils/hashPassword';
import { useParticipant } from '@/contexts/ParticipantContext';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

type Step = 'email' | 'set-password' | 'enter-password';

const ParticipantLogin = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storedHash, setStoredHash] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useParticipant();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const participant = await getParticipantByEmail(email.trim());

      if (!participant) {
        toast({
          title: 'Not Registered',
          description: 'You are not a registered participant. Contact your organizer.',
          variant: 'destructive',
        });
        return;
      }

      if (participant.passwordSet) {
        setStoredHash(participant.hashedPassword);
        setStep('enter-password');
      } else {
        setStep('set-password');
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Too Short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const hashed = await hashPassword(password);
      await setParticipantPassword(email.trim(), hashed, firstName.trim(), lastName.trim());
      login(email.trim());
      toast({ title: 'Welcome! 👋', description: 'Your password has been set. You are now logged in.' });
      navigate('/submit');
    } catch {
      toast({ title: 'Error', description: 'Failed to set password. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const hashed = await hashPassword(password);

      if (hashed === storedHash) {
        login(email.trim());
        toast({ title: 'Welcome back! 👋', description: 'You are now logged in.' });
        navigate('/submit');
      } else {
        toast({ title: 'Wrong Password', description: 'The password you entered is incorrect.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative"
      style={{ background: 'var(--hack-cream)', fontFamily: "'Inter', 'Poppins', sans-serif" }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(245, 196, 0, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(245, 196, 0, 0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            border: '2px solid rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
              style={{ background: 'rgba(245, 196, 0, 0.15)', color: '#92700c', border: '1px solid rgba(245, 196, 0, 0.3)' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              🚀 Bot to Agent
            </motion.div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Poppins', sans-serif", color: '#000' }}
            >
              {step === 'email' && 'Participant Login'}
              {step === 'set-password' && 'Create Your Account'}
              {step === 'enter-password' && 'Welcome Back'}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              {step === 'email' && 'Enter your registered email to continue'}
              {step === 'set-password' && 'Enter your name and set a password'}
              {step === 'enter-password' && 'Enter your password to continue'}
            </p>
          </div>

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm"
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-300"
                style={{
                  background: loading ? '#666' : '#000',
                  color: '#fff',
                  boxShadow: loading ? 'none' : '4px 4px 0 rgba(245, 196, 0, 0.5)',
                }}
              >
                {loading ? 'Checking…' : 'Continue →'}
              </button>
            </form>
          )}

          {/* Step 2a: Set Password (first time) */}
          {step === 'set-password' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 mb-2">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">First time?</span> Set up your profile and password.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm"
                    placeholder="John"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Set Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm"
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-300"
                style={{
                  background: loading ? '#666' : '#000',
                  color: '#fff',
                  boxShadow: loading ? 'none' : '4px 4px 0 rgba(245, 196, 0, 0.5)',
                }}
              >
                {loading ? 'Setting password…' : 'Set Password & Login'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setPassword(''); setConfirmPassword(''); setFirstName(''); setLastName(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                ← Back to email
              </button>
            </form>
          )}

          {/* Step 2b: Enter Password (returning user) */}
          {step === 'enter-password' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 mb-2">
                <p className="text-xs text-gray-600">
                  Logging in as <span className="font-mono font-semibold">{email}</span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#F5C400] transition-colors text-sm"
                  placeholder="Enter your password"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-300"
                style={{
                  background: loading ? '#666' : '#000',
                  color: '#fff',
                  boxShadow: loading ? 'none' : '4px 4px 0 rgba(245, 196, 0, 0.5)',
                }}
              >
                {loading ? 'Verifying…' : 'Login →'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setPassword(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ParticipantLogin;
