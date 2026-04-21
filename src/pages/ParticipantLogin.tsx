import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getParticipantByEmail, setParticipantPassword } from '@/utils/firestoreHelpers';
import { hashPassword } from '@/utils/hashPassword';
import { useParticipant } from '@/contexts/ParticipantContext';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
        // Pre-fill name if participant already has one (e.g., password reset)
        if (participant.firstName) setFirstName(participant.firstName);
        if (participant.lastName) setLastName(participant.lastName);
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
      toast({ title: 'Welcome! 👋', description: 'Your account has been created. You are now logged in.' });
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

  const stepNumber = step === 'email' ? 1 : 2;

  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-white border-2 border-gray-100 text-gray-900 focus:outline-none focus:border-[#F5C400] focus:ring-4 focus:ring-[#F5C400]/10 transition-all text-sm placeholder:text-gray-400";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FFFDF5 0%, #FFF9E5 50%, #FFF5D6 100%)', fontFamily: "'Inter', 'Poppins', sans-serif" }}
    >
      {/* Decorative elements */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(245, 196, 0, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(29, 83, 159, 0.05) 0%, transparent 40%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'linear-gradient(to right, rgba(245, 196, 0, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(245, 196, 0, 0.06) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Floating decorative shapes */}
      <motion.div
        className="fixed w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'rgba(245, 196, 0, 0.15)', top: '10%', right: '15%' }}
        animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'rgba(29, 83, 159, 0.1)', bottom: '15%', left: '10%' }}
        animate={{ y: [0, 15, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        {/* Card */}
        <div
          className="rounded-3xl p-8 md:p-10"
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          }}
        >
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${stepNumber >= 1 ? 'bg-[#F5C400]' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${stepNumber >= 2 ? 'bg-[#F5C400]' : 'bg-gray-200'}`} />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
              style={{ background: 'linear-gradient(135deg, rgba(245, 196, 0, 0.15), rgba(245, 196, 0, 0.05))', color: '#92700c', border: '1px solid rgba(245, 196, 0, 0.25)' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              🚀 Bot to Agent
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1
                  className="text-2xl md:text-3xl font-bold tracking-tight"
                  style={{ fontFamily: "'Poppins', sans-serif", color: '#000' }}
                >
                  {step === 'email' && 'Participant Login'}
                  {step === 'set-password' && 'Create Your Account'}
                  {step === 'enter-password' && 'Welcome Back'}
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                  {step === 'email' && 'Enter your registered email to continue'}
                  {step === 'set-password' && 'Set up your profile and password'}
                  {step === 'enter-password' && 'Enter your password to continue'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step 1: Email */}
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.form
                key="email-form"
                onSubmit={handleEmailSubmit}
                className="space-y-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="your@email.com"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98]"
                  style={{
                    background: loading ? '#999' : '#000',
                    color: '#fff',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.15), 4px 4px 0 rgba(245, 196, 0, 0.5)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Checking…
                    </span>
                  ) : 'Continue →'}
                </button>
              </motion.form>
            )}

            {/* Step 2a: Set Password (first time) */}
            {step === 'set-password' && (
              <motion.form
                key="set-password-form"
                onSubmit={handleSetPassword}
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 py-3 rounded-xl bg-blue-50/80 border border-blue-100/80">
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
                      className={inputClass}
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
                      className={inputClass}
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
                    className={inputClass}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Re-enter your password"
                    required
                    minLength={6}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98]"
                  style={{
                    background: loading ? '#999' : '#000',
                    color: '#fff',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.15), 4px 4px 0 rgba(245, 196, 0, 0.5)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting password…
                    </span>
                  ) : 'Create Account & Login →'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setPassword(''); setConfirmPassword(''); setFirstName(''); setLastName(''); }}
                  className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors py-1"
                >
                  ← Back to email
                </button>
              </motion.form>
            )}

            {/* Step 2b: Enter Password (returning user) */}
            {step === 'enter-password' && (
              <motion.form
                key="enter-password-form"
                onSubmit={handleLogin}
                className="space-y-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 py-3 rounded-xl bg-gray-50/80 border border-gray-100/80">
                  <p className="text-xs text-gray-600">
                    Logging in as <span className="font-semibold text-gray-800">{email}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Enter your password"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98]"
                  style={{
                    background: loading ? '#999' : '#000',
                    color: '#fff',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.15), 4px 4px 0 rgba(245, 196, 0, 0.5)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying…
                    </span>
                  ) : 'Login →'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setPassword(''); }}
                  className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors py-1"
                >
                  ← Use a different email
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ParticipantLogin;
