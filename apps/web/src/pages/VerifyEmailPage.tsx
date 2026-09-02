import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, MailCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (!token) return;
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/verify-email', { token });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Object && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Verification failed. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/resend-verification');
      alert('Verification email sent! Check your inbox.');
    } catch {
      setError('Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Token-based verification
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-surface-0">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="w-full max-w-md text-center">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">TalentIQ</span>
          </div>

          {success ? (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={staggerItem} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-500/10 border border-success-500/20 mx-auto mb-4">
                <MailCheck className="h-7 w-7 text-success-500" />
              </motion.div>
              <motion.h1 variants={staggerItem} className="text-2xl font-bold text-surface-950 mb-2">Email verified!</motion.h1>
              <motion.p variants={staggerItem} className="text-surface-600 mb-6">Your email has been verified successfully.</motion.p>
              <motion.div variants={staggerItem}>
                <Button asChild className="w-full h-11">
                  <Link to="/dashboard">
                    Go to dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          ) : error ? (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={staggerItem} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-500/10 border border-danger-500/20 mx-auto mb-4">
                <AlertTriangle className="h-7 w-7 text-danger-500" />
              </motion.div>
              <motion.h1 variants={staggerItem} className="text-2xl font-bold text-surface-950 mb-2">Verification failed</motion.h1>
              <motion.p variants={staggerItem} className="text-surface-600 mb-6">{error}</motion.p>
              <motion.div variants={staggerItem}>
                <Button asChild variant="secondary" className="w-full h-11">
                  <Link to="/login">Back to sign in</Link>
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={staggerItem} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/10 border border-brand-600/20 mx-auto mb-4">
                <MailCheck className="h-7 w-7 text-brand-400 animate-pulse" />
              </motion.div>
              <motion.h1 variants={staggerItem} className="text-2xl font-bold text-surface-950 mb-2">Verifying your email...</motion.h1>
              <motion.div variants={staggerItem}>
                <Button onClick={handleVerify} className="mt-4" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Click to verify'}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // No token — show resend option
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface-0">
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="w-full max-w-md text-center">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gradient">TalentIQ</span>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={staggerItem} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-500/10 border border-warning-500/20 mx-auto mb-4">
            <MailCheck className="h-7 w-7 text-warning-500" />
          </motion.div>
          <motion.h1 variants={staggerItem} className="text-2xl font-bold text-surface-950 mb-2">Verify your email</motion.h1>
          <motion.p variants={staggerItem} className="text-surface-600 mb-6">
            {user?.email ? (
              <>We sent a verification link to <span className="font-medium text-surface-950">{user.email}</span></>
            ) : (
              'Please check your email for a verification link.'
            )}
          </motion.p>

          {error && (
            <motion.p variants={staggerItem} className="text-sm text-danger-500 mb-4">{error}</motion.p>
          )}

          <motion.div variants={staggerItem} className="space-y-3">
            <Button onClick={handleResend} className="w-full h-11" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Resend verification email'}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/dashboard">Skip for now</Link>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
