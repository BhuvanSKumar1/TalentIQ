import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '@/lib/animations';

export function LoginPage() {
  const [email, setEmail] = useState('admin@techvista.io');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Object && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-50"
      >
        <div className="absolute inset-0 gradient-brand opacity-5" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-brand">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gradient">TalentIQ</span>
          </div>

          <h2 className="text-4xl font-bold text-surface-950 mb-4 leading-tight">
            AI-Powered
            <br />
            Recruitment
            <br />
            Intelligence
          </h2>
          <p className="text-lg text-surface-700 max-w-md leading-relaxed">
            Transform your hiring process with intelligent candidate matching,
            explainable AI recommendations, and comprehensive analytics.
          </p>

          {/* Feature highlights */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-12 space-y-4"
          >
            {[
              { label: 'Semantic Candidate Matching', desc: 'AI understands context, not just keywords' },
              { label: 'Explainable AI Rankings', desc: 'Evidence for every recommendation' },
              { label: 'Fairness & Bias Detection', desc: 'Proactive bias monitoring and alerts' },
            ].map((feature) => (
              <motion.div
                key={feature.label}
                variants={staggerItem}
                className="flex items-start gap-3 p-3 rounded-lg border border-surface-300/50 bg-surface-100/40"
              >
                <div className="mt-0.5 h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-surface-950">{feature.label}</p>
                  <p className="text-xs text-surface-600">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Right panel - login form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex w-full lg:w-1/2 items-center justify-center p-8"
      >
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">TalentIQ</span>
          </div>

          <motion.div variants={slideUp} initial="hidden" animate="visible">
            <h1 className="text-2xl font-bold text-surface-950 mb-2">Welcome back</h1>
            <p className="text-surface-600 mb-8">Sign in to your recruitment dashboard</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-lg border border-danger-500/20 bg-danger-500/5 p-3 text-sm text-danger-500"
            >
              {error}
            </motion.div>
          )}

          <motion.form
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-surface-900">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={staggerItem}>
              <label className="mb-1.5 block text-sm font-medium text-surface-900">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-600 hover:text-surface-950 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-surface-400 bg-surface-200 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-surface-700">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Forgot password?
              </Link>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </motion.div>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center text-sm text-surface-600"
          >
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-brand-400 hover:text-brand-300 transition-colors">
              Get started
            </Link>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 rounded-lg border border-surface-300 bg-surface-100/50 p-4"
          >
            <p className="text-xs font-medium text-surface-700 mb-2">Demo Accounts</p>
            <div className="space-y-1 text-xs text-surface-600">
              <p><span className="font-medium text-surface-800">Admin:</span> admin@techvista.io</p>
              <p><span className="font-medium text-surface-800">Recruiter:</span> recruiter@techvista.io</p>
              <p><span className="font-medium text-surface-800">Password:</span> password123</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
