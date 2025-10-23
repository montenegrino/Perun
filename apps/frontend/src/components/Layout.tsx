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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-perper-gold">Perper Wallet</span>
              </Link>

              <div className="hidden md:flex space-x-4">
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <Link
                  to="/send"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  Send
                </Link>
                <Link
                  to="/transactions"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  Transactions
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 rounded-md text-sm font-medium text-perper-gold hover:bg-gray-100"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-600 text-center">
            This is a closed, centralized token system, not cryptocurrency or e-money.
            No withdrawals or external transfers. Token purchases are non-refundable except where required by law.
          </p>
        </div>
      </footer>
    </div>
  );
}
