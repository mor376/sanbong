import './globals.css';
import { Be_Vietnam_Pro } from 'next/font/google';
import { SiteAuthProvider } from '@/components/site-auth';
import ContactFloat from '@/components/contact-float';
const f = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: ['400', '500', '600', '700'] });
export const metadata = { title: 'FAGLEAGUE247' };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="vi" data-scroll-behavior="smooth"><body className={f.className} suppressHydrationWarning><SiteAuthProvider>{children}<ContactFloat /></SiteAuthProvider></body></html>;
}
