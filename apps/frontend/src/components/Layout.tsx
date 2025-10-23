import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-brand-light-bg">
      {/* Dark Premium Header */}
      <nav className="bg-gradient-dark border-b border-brand-gold/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="flex items-center space-x-3 group">
                <img
                  src="https://www.perper.digital/images/perper-Logo.png"
                  alt="Perper Logo"
                  className="h-10 w-auto"
                />
                <span className="text-2xl font-bold bg-gradient-gold bg-clip-text text-transparent">
                  Perper Wallet
                </span>
              </Link>

              <div className="hidden md:flex space-x-1">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text-light
                             hover:bg-brand-gold/10 hover:text-brand-gold transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  to="/send"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text-light
                             hover:bg-brand-gold/10 hover:text-brand-gold transition-all"
                >
                  Send
                </Link>
                <Link
                  to="/buy"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text-light
                             hover:bg-brand-gold/10 hover:text-brand-gold transition-all"
                >
                  Buy
                </Link>
                <Link
                  to="/transactions"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text-light
                             hover:bg-brand-gold/10 hover:text-brand-gold transition-all"
                >
                  Transactions
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-gold/20 text-brand-gold
                               hover:bg-brand-gold hover:text-white transition-all"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-brand-gold/10 border border-brand-gold/20">
                <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></div>
                <span className="text-sm font-medium text-brand-gold">
                  {user?.username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-brand-text-light
                           border border-brand-gold/30 hover:bg-brand-gold/10 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Light Background */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-dark border-t border-brand-gold/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <img
                src="https://www.perper.digital/images/perper-Logo.png"
                alt="Perper"
                className="h-8 w-auto opacity-80"
              />
              <div className="h-8 w-px bg-brand-gold/20"></div>
              <span className="text-brand-gold font-semibold">Perper Wallet</span>
            </div>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
              This is a closed, centralized token system, not cryptocurrency or e-money.
              No withdrawals or external transfers. Token purchases are non-refundable except where required by law.
            </p>
            <div className="text-xs text-gray-500">
              © {new Date().getFullYear()} Perper Digital. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
