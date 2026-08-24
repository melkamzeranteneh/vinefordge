'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Share2,
  GitBranch,
  MousePointer2,
  Plus,
  Users,
  Sparkles,
  Link2,
  Github,
  Twitter,
} from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/theme';
import { cn } from '@/shared/utils';

const HeroScene = dynamic(() => import('@/components/landing/HeroScene'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-muted/40" />,
});

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const FEATURES = [
  {
    icon: Zap,
    title: 'Real-time collaboration',
    body: 'Every node, cursor and edit syncs instantly across the team. No refresh, no merge conflicts, no waiting.',
  },
  {
    icon: GitBranch,
    title: 'AI-powered branching',
    body: 'Stuck on a thought? Expand any node into new directions with AI and break through creative blocks in one click.',
  },
  {
    icon: Share2,
    title: 'Sharing without friction',
    body: 'Invite teammates with editor or viewer roles, or publish a read-only link. Your boards stay yours.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Create a board',
    body: 'Open a blank canvas and capture your first thought as a node. It takes seconds, and there is nothing to configure.',
  },
  {
    n: '02',
    title: 'Branch with AI',
    body: 'Select any idea and let Vineforge suggest related directions, questions and angles you might have missed.',
  },
  {
    n: '03',
    title: 'Invite your team',
    body: 'Share a link and collaborate live. Watch cursors, edits and new branches appear as they happen.',
  },
];

const QUICK_STATS = [
  { icon: Users, label: 'Live multiplayer editing' },
  { icon: Sparkles, label: 'AI branches on any node' },
  { icon: Link2, label: 'One-link sharing' },
];

function MockNode({
  className,
  tag,
  title,
  body,
  accent = false,
}: {
  className?: string;
  tag: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'absolute w-[24%] rounded-lg border bg-card p-3 shadow-sm',
        accent ? 'border-primary/40' : 'border-border',
        className
      )}
    >
      <span
        className={cn(
          'mb-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-medium',
          accent ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
        )}
      >
        {tag}
      </span>
      <p className="truncate text-[11px] font-semibold leading-tight">{title}</p>
      <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function FloatingCursor({
  name,
  color,
  className,
  delay = 0,
}: {
  name: string;
  color: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn('absolute z-10 flex items-start gap-1', className)}
      animate={{ y: [0, -9, 4, 0], x: [0, 6, -4, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <MousePointer2 size={14} style={{ color }} fill={color} />
      <span
        className="rounded-md px-1.5 py-0.5 text-[9px] font-medium text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <header className="glass sticky top-0 z-50 border-b border-border">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <button
            onClick={() => router.push('/')}
            aria-label="Vineforge home"
            className="ring-focus rounded-md"
          >
            <Logo className="h-7" priority />
          </button>

          <div className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#preview"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Product
            </a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => router.push('/auth')} className="btn-ghost hidden sm:inline-flex">
              Sign in
            </button>
            <button onClick={() => router.push('/auth')} className="btn-primary">
              Sign up
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-20 pt-14 md:grid-cols-[1.05fr_1fr] md:gap-6 md:pt-20 lg:pt-24">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 left-[8%] h-[420px] w-[560px] rounded-full bg-primary/[0.07] blur-[130px]" />
          </div>

          <div className="max-w-xl">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                New — AI idea branching is here
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="mt-6 font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-[3.6rem]"
            >
              Brainstorm better,
              <br />
              together.
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="mt-5 text-lg leading-relaxed text-muted-foreground"
            >
              Vineforge is a living canvas for your team&apos;s ideas. Sketch thoughts as nodes,
              branch them with AI, and watch every cursor move in real time.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <button onClick={() => router.push('/auth')} className="btn-primary group px-5 py-2.5 text-[15px]">
                Get started — it&apos;s free
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() =>
                  document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="btn-secondary px-5 py-2.5 text-[15px]"
              >
                See how it works
              </button>
            </motion.div>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.55, delay: 0.32 }}
              className="mt-4 text-xs text-muted-foreground/80"
            >
              Free for personal projects · No credit card required
            </motion.p>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6"
            >
              {QUICK_STATS.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <s.icon size={15} className="text-foreground" strokeWidth={1.75} />
                  {s.label}
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[380px] sm:h-[460px] md:h-[520px] lg:h-[580px]"
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.08] blur-[90px]" />
            <HeroScene />
            <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-muted-foreground/70">
              Move your cursor — the canvas is alive
            </p>
          </motion.div>
        </section>

        {/* Product preview */}
        <section id="preview" className="scroll-mt-20 px-6 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/[0.04] dark:shadow-black/30"
          >
            <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
              <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
              <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
              <span className="ml-3 truncate rounded-md border border-border bg-card px-3 py-1 font-mono text-[10px] text-muted-foreground">
                vineforge.app/board/q3-launch
              </span>
              <span className="ml-auto hidden rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary sm:block">
                Live · 3 editors
              </span>
            </div>

            <div className="relative aspect-[16/9] bg-background">
              <div className="absolute inset-0 bg-dot-pattern opacity-25 dark:opacity-15" />

              <svg
                viewBox="0 0 800 450"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <path
                  d="M400 150 C 400 220, 210 210, 210 265"
                  fill="none"
                  strokeDasharray="5 5"
                  style={{ stroke: 'hsl(var(--muted-foreground) / 0.55)' }}
                  strokeWidth="1.5"
                />
                <path
                  d="M400 150 C 400 215, 590 200, 590 255"
                  fill="none"
                  strokeDasharray="5 5"
                  style={{ stroke: 'hsl(var(--primary) / 0.6)' }}
                  strokeWidth="1.5"
                />
              </svg>

              <MockNode
                className="left-[38%] top-[11%]"
                tag="Idea"
                title="Q3 launch campaign"
                body="Big-picture narrative for the launch across channels."
                accent
              />
              <MockNode
                className="left-[9%] top-[57%]"
                tag="Idea"
                title="Teaser video"
                body="15-second cut showing the canvas in motion."
              />
              <MockNode
                className="left-[62%] top-[53%]"
                tag="AI branch"
                title="Community beta"
                body="Invite power users early and collect testimonials."
              />

              <FloatingCursor name="Mia" color="#a371f7" className="left-[28%] top-[42%]" />
              <FloatingCursor name="Devon" color="#3fb950" className="left-[72%] top-[78%]" delay={1.6} />

              <div className="absolute bottom-4 left-4 inline-flex h-8 w-8 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-card p-1.5 shadow-sm">
                <Plus size={13} className="text-foreground" />
                <span className="h-px w-3.5 bg-border" />
              </div>
              <div className="absolute bottom-4 right-4 rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground">
                Saved · just now
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-t border-border bg-card/40 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-14 max-w-2xl text-center"
            >
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Everything your ideas need to grow
              </h2>
              <p className="mt-4 text-muted-foreground">
                A workspace built around one belief: thinking is better when it happens together.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="card-surface group p-7 hover:border-foreground/25"
                >
                  <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-secondary text-foreground transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon size={18} strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-t border-border px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="mb-14 max-w-xl"
            >
              <h2 className="font-display text-3xl font-bold sm:text-4xl">How it works</h2>
              <p className="mt-4 text-muted-foreground">
                From a blank canvas to a shared idea tree in three steps.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="relative border-t border-border pt-6"
                >
                  <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
                  <h3 className="mb-2 mt-3 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border px-6 pb-24 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="card-surface relative mx-auto max-w-3xl p-10 text-center md:p-14"
          >
            <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-15 dark:opacity-10" />
            <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-[380px] -translate-x-1/2 rounded-full bg-primary/10 blur-[90px]" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Ready to forge your next big idea?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                Create your first board in seconds and see how good collaboration can feel.
              </p>
              <button onClick={() => router.push('/auth')} className="btn-primary group mx-auto mt-8 px-6 py-2.5 text-[15px]">
                Start forging — free
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Logo className="h-6" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The collaborative canvas where ideas grow.
            </p>
          </div>

          {[
            {
              heading: 'Product',
              links: [
                { label: 'Features', href: '#features' },
                { label: 'How it works', href: '#how-it-works' },
                { label: 'Get started', href: '/auth' },
              ],
            },
            {
              heading: 'Resources',
              links: [
                { label: 'Documentation', href: '#' },
                { label: 'Community', href: '#' },
                { label: 'Support', href: '#' },
              ],
            },
            {
              heading: 'Company',
              links: [
                { label: 'About', href: '#' },
                { label: 'Blog', href: '#' },
                { label: 'Contact', href: '#' },
              ],
            },
          ].map((col) => (
            <div key={col.heading}>
              <h4 className="mb-3 text-sm font-semibold">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} Vineforge. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a href="#" aria-label="GitHub" className="transition-colors hover:text-foreground">
              <Github size={17} />
            </a>
            <a href="#" aria-label="Twitter" className="transition-colors hover:text-foreground">
              <Twitter size={17} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

