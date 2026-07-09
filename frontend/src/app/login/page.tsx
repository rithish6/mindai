'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Sparkles, Loader2, Github, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const auth = getAuth();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithGithub();
      router.push('/');
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0F] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic decorative gradient circles in the background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[130px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/25 blur-[130px] animate-pulse pointer-events-none" style={{ animationDuration: '10s' }} />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-ai text-white shadow-glow mb-4">
            <Sparkles size={24} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">SNAPLEARN AI</h1>
          <p className="text-sm text-textMuted mt-2">Intelligent Learning Management Platform</p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-surface border border-white/5 relative">
          <h2 className="text-xl font-bold text-white text-center mb-6">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>

          <form className="space-y-5" onSubmit={handleEmailAuth}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email-address" className="text-xs font-semibold text-textMuted uppercase tracking-wider ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-textMuted">
                  <Mail size={18} />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full h-12 rounded-xl border border-border bg-surface/50 pl-11 pr-4 text-sm text-white placeholder:text-textMuted/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-textMuted uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-textMuted">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  className="block w-full h-12 rounded-xl border border-border bg-surface/50 pl-11 pr-4 text-sm text-white placeholder:text-textMuted/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-medium text-center animate-shake">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-ai font-semibold text-sm text-white shadow-glow hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold text-textMuted">
              <span className="bg-[#13131a] px-3">Or Connect With</span>
            </div>
          </div>

          {/* Social Sign-In Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="flex h-11 items-center justify-center gap-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 transition-colors text-sm font-semibold text-white disabled:opacity-50"
            >
              {/* Custom flat Google SVG */}
              <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.43c0,-0.66 -0.06,-1.3 -0.17,-1.95z" fill="#4285F4" />
                  <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-2.92,-2.26c-0.8,0.54 -1.84,0.86 -3.04,0.86c-2.34,0 -4.33,-1.58 -5.04,-3.7H3.54v2.33c1.49,2.96 4.55,4.97 8.46,4.97z" fill="#34A853" />
                  <path d="M6.96,13.3c-0.18,-0.54 -0.28,-1.12 -0.28,-1.7c0,-0.58 0.1,-1.16 0.28,-1.7V7.57H3.54c-0.62,1.24 -0.97,2.64 -0.97,4.13c0,1.49 0.35,2.89 0.97,4.13l3.42,-2.33z" fill="#FBBC05" />
                  <path d="M12,6.5c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,3.8 14.43,3 12,3C8.09,3 5.03,5.01 3.54,7.97l3.42,2.66c0.71,-2.12 2.7,-3.7 5.04,-3.7z" fill="#EA4335" />
                </g>
              </svg>
              <span>Google</span>
            </button>
            <button
              onClick={handleGithubSignIn}
              disabled={isSubmitting}
              className="flex h-11 items-center justify-center gap-2.5 rounded-xl bg-white/5 border border-border hover:bg-white/10 transition-colors text-sm font-semibold text-white disabled:opacity-50"
            >
              <Github size={16} />
              <span>GitHub</span>
            </button>
          </div>
        </div>

        {/* Toggle Sign In / Sign Up */}
        <div className="text-center mt-6">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primaryHover text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
