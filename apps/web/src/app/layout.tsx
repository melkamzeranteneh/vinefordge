import type { Metadata } from 'next';
import ToastProvider from '@/components/ToastProvider';
import { ThemeProvider } from '@/components/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vineforge',
  description: 'Collaborative, node-based brainstorming workspace.',
};

const themeInitScript = `
(function () {
  try {
    var key = 'vineforge-theme';
    var stored = localStorage.getItem(key);
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider />
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
