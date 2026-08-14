import type { Metadata } from 'next';
import ToastProvider from '@/components/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vineforge',
  description: 'Collaborative, node-based brainstorming workspace.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider />
        <div className="dark min-h-screen bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  );
}
