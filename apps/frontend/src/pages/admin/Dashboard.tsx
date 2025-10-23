import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await adminApi.getDashboard();
      return response.data;
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/users" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">User Management</h3>
          <p className="text-3xl font-bold text-perper-gold">{stats?.users.pending}</p>
          <p className="text-sm text-gray-600">Pending Approval</p>
        </Link>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Transactions Today</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.transactions.today}</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.users.total}</p>
        </div>
      </div>

      {/* Token Stats */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Token Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats?.tokens.map((token: any) => (
            <div key={token.token} className="card">
              <h3 className="text-lg font-semibold mb-3">{token.token}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Supply:</span>
                  <span className="font-medium">{token.totalSupply.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">In Circulation:</span>
                  <span className="font-medium">{token.inCirculation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium">{token.available.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">€{token.currentPrice?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Admin Activity</h2>
        <div className="card">
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="divide-y">
              {stats.recentActivity.map((log: any) => (
                <div key={log._key} className="py-3">
                  <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
