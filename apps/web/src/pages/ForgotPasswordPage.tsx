import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Object && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface-0">
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gradient">TalentIQ</span>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="text-center mb-8">
          {sent ? (
            <>
              <motion.div variants={staggerItem} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-500/10 border border-success-500/20 mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-success-500" />
              </motion.div>
              <motion.h1 variants={staggerItem} className="text-2xl font-bold text-surface-950 mb-2">Check your email</motion.h1>
              <motion.p variants={staggerItem} className="text-surface-600">
                If an account exists with <span className="font-medium text-surface-950">{email}</span>, we&apos;ve sent a password reset link.
              </motion.p>
            </>
          ) : (
            <>
              <motion.h1 variants={staggerItem} className="text-2xl font-bold text-surface-950 mb-2">Forgot your password?</motion.h1>
              <motion.p variants={staggerItem} className="text-surface-600">
                Enter your email and we&apos;ll send you a link to reset your password.
              </motion.p>
            </>
          )}
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg border border-danger-500/20 bg-danger-500/5 p-3 text-sm text-danger-500">
            {error}
          </motion.div>
        )}

        {sent ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
            <motion.div variants={staggerItem}>
              <Button asChild className="w-full h-11" variant="secondary">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to sign in
                </Link>
              </Button>
            </motion.div>
            <motion.p variants={staggerItem} className="text-center text-xs text-surface-600">
              Didn&apos;t receive the email?{' '}
              <button onClick={() => { setSent(false); setError(''); }} className="text-brand-400 hover:text-brand-300 transition-colors">
                Try again
              </button>
            </motion.p>
          </motion.div>
        ) : (
          <motion.form variants={staggerContainer} initial="hidden" animate="visible" onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-surface-900">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
                <Input type="email" placeholder="you@company.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending reset link...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Send reset link
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </motion.div>
          </motion.form>
        )}

        {!sent && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-6 text-center text-sm text-surface-600">
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
