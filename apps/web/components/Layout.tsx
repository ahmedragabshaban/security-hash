import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

const tabs = [
  { href: '/generate', label: 'Generate' },
  { href: '/check', label: 'Check' },
];

const NavTabs = () => {
  const { pathname } = useRouter();

  return (
    <nav className="nav-tabs" aria-label="Main navigation">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`nav-tab ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => (
  <div className="app-shell">
    <header className="top-bar">
      <Link href="/generate" className="brand">
        Security Hash
      </Link>
      <NavTabs />
    </header>
    <main className="content">{children}</main>
  </div>
);

export default Layout;
