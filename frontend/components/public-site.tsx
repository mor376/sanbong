import type { ReactNode } from 'react';
import SiteFooter from './site-footer';
import SiteHeader from './site-header';

export function PublicSite({ children }: { children: ReactNode }) {
  return (
    <div className="fl-page">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="public-page">
      <header className="public-page-heading">
        <span className="public-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      <div className="public-page-content">{children}</div>
    </main>
  );
}
