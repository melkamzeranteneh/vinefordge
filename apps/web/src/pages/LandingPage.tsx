import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Share2, MousePointer2, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-8 py-6 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <BrainCircuit className="text-primary-foreground w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Vineforge</span>
                </div>
                <div className="flex items-center gap-6">
                    <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
                    <button
                        onClick={() => navigate('/auth')}
                        className="text-sm font-medium px-4 py-2 rounded-full border border-border hover:bg-muted transition-colors"
                    >
                        Log in
                    </button>
                    <button
                        onClick={() => navigate('/auth')}
                        className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-8 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]" />
                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
                                Visualize your thoughts <br /> in a collaborative canvas.
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                                The modern, node-based workspace for collaborative brainstorming.
                                Powered by AI to help you forge ideas faster.
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => navigate('/auth')}
                                    className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:opacity-90 transition-all flex items-center gap-2"
                                >
                                    Start Forging <ArrowRight className="w-5 h-5" />
                                </button>
                                <button className="px-8 py-4 bg-transparent border border-border rounded-full font-semibold text-lg hover:bg-muted transition-all">
                                    Request Demo
                                </button>
                            </div>
                        </motion.div>

                        {/* Mockup Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="mt-20 relative px-4"
                        >
                            <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-blue-500/10">
                                <div className="rounded-xl border border-border bg-background overflow-hidden aspect-video relative group">
                                    <div className="absolute inset-0 bg-dot-pattern opacity-10" />
                                    <div className="flex items-center justify-center h-full">
                                        <span className="text-muted-foreground text-sm flex items-center gap-2">
                                            <MousePointer2 className="w-4 h-4 animate-bounce" /> Loading your workspace...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-muted/30">
                    <div className="max-w-6xl mx-auto px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-blue-500">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-4">Instant Collaboration</h3>
                                <p className="text-muted-foreground text-pretty">
                                    Work together in real-time with zero latency. Every stroke and node is synced instantly.
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 text-purple-500">
                                    <BrainCircuit className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-4">AI Forged Ideas</h3>
                                <p className="text-muted-foreground text-pretty">
                                    Connect to Mistral AI to expand nodes, generate suggestions, and break through creative blocks.
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 text-emerald-500">
                                    <Share2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-4">Seamless Sharing</h3>
                                <p className="text-muted-foreground text-pretty">
                                    Export to common formats or share a persistent link with your team instantly.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-12 px-8 border-t border-border">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                            <BrainCircuit className="text-primary-foreground w-4 h-4" />
                        </div>
                        <span className="font-bold tracking-tight">Vineforge</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        © 2024 Vineforge AI. All rights reserved.
                    </div>
                </div>
            </footer>

            <style>{`
        .bg-dot-pattern {
          background-image: radial-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
        </div>
    );
};

export default LandingPage;
