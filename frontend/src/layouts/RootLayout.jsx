import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Navbar } from '../components/Navbar.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Footer } from '../components/Footer.jsx';

const SKIP_LINK = (
  <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-white">
    Skip to main content
  </a>
);

export function RootLayout() {
  const { isAuthenticated } = useAuth();

  // Signed-in learners get the sidebar + top bar app shell (with bottom nav on mobile);
  // logged-out visitors browsing public pages get the simpler marketing-site navbar.
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen">
        {SKIP_LINK}
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopBar />
          <main id="main-content" className="flex-1 pb-16 lg:pb-0">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {SKIP_LINK}
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
