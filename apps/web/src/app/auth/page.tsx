'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { sileo } from 'sileo';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await getSupabase().auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/auth'
          }
        });
        if (error) throw error;
        sileo.success({ title: 'Confirmation Sent', description: 'Check your email to confirm your account!' });
      } else {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        if (error) throw error;
        sileo.success({ title: 'Welcome back!', description: 'Logged in successfully!' });
        router.push('/dashboard');
      }
    } catch (error: any) {
      sileo.error({ title: 'Authentication failed', description: error.message || 'Please try again' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl shadow-blue-500/5">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
              <BrainCircuit className="text-primary-foreground w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isSignUp ? 'Start forging your ideas today' : 'Continue your brainstorming session'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-semibold hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
