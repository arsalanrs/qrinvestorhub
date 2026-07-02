import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuestRock Investor Hub',
  description: 'Investor loan financing, simplified. Get terms for your next investment loan with a guided QuestRock intake.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ minHeight: '100%', margin: 0 }}>{children}</body>
    </html>
  );
}
