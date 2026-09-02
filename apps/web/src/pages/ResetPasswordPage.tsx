import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Lock, ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Object && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-surface-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-500/10 border border-danger-500/20 mx-auto mb-4">
            <Lock className="h-7 w-7 text-danger-500" />
          </div>
          <h1 className="text-2xl font-bold text-surface-950 mb-2">Invalid reset link</h1>
          <p className="text-surface-600 mb-6">This password reset link is invalid or missing. Please request a new one.</p>
          <Button asChild variant="secondary">
            <Link to="/forgot-password">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Request new link
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

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
          {success ? (
            <>
              <motion.div variants={staggerItem} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-500/10 border border-success-500/20 mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-success-500" />
              </motion.div>
              <motion.h1 variants={staggerItem} className="text-2xl font-bold text-surface-950 mb-2">Password reset!</motion.h1>
              <motion.p variants={staggerItem} className="text-surface-600">Your password has been updated successfully.</motion.p>
            </>
          ) : (
            <>
              <motion.h1 variants={staggerItem} className="text-2xl font-bold text-surface-950 mb-2">Set new password</motion.h1>
              <motion.p variants={staggerItem} className="text-surface-600">Choose a strong password for your account.</motion.p>
            </>
          )}
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg border border-danger-500/20 bg-danger-500/5 p-3 text-sm text-danger-500">
            {error}
          </motion.div>
        )}

        {success ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div variants={staggerItem}>
              <Button asChild className="w-full h-11">
                <Link to="/login">
                  Sign in with new password
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.form variants={staggerContainer} initial="hidden" animate="visible" onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-surface-900">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
                <Input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10" minLength={8} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-600 hover:text-surface-950 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-surface-900">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
                <Input type={showPassword ? 'text' : 'password'} placeholder="Confirm your password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10" minLength={8} required />
              </div>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Resetting password...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Reset password
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </motion.div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
