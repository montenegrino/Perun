import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { walletApi } from '../services/api';
import { TOKENS, TokenSymbol } from '@perper/shared';

export default function Dashboard() {
  const { data: walletsData, isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const response = await walletApi.getWallets();
      return response.data.wallets;
    }
  });

  const { data: txData } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const response = await walletApi.getTransactions({ size: 5 });
      return response.data.transactions;
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const totalFiatValue = walletsData?.reduce((sum: number, w: any) => sum + (w.fiatValue || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="space-x-2">
          <Link to="/buy" className="btn-primary">
            Buy Tokens
          </Link>
          <Link to="/send" className="btn-secondary">
            Send Tokens
          </Link>
        </div>
      </div>

      {/* Total Value */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Portfolio Value</h2>
        <p className="text-4xl font-bold text-perper-gold">
          €{totalFiatValue.toFixed(2)}
        </p>
      </div>

      {/* Wallets */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Wallets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {walletsData?.map((wallet: any) => {
            const tokenConfig = TOKENS[wallet.token as TokenSymbol];
            return (
              <div
                key={wallet.token}
                className="card border-l-4"
                style={{ borderLeftColor: tokenConfig.accentColor }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{tokenConfig.name}</h3>
                  <span
                    className="px-2 py-1 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: tokenConfig.accentColor }}
                  >
                    {wallet.token}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-3xl font-bold">{wallet.balance.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">≈ €{(wallet.fiatValue || 0).toFixed(2)}</p>
                </div>

                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                  <p className="text-xs font-mono break-all">{wallet.address}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <Link to="/transactions" className="text-sm text-perper-gold hover:underline">
            View all
          </Link>
        </div>

        <div className="card">
          {txData && txData.length > 0 ? (
            <div className="divide-y">
              {txData.map((tx: any) => (
                <div key={tx._key} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium capitalize">{tx.type}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {tx.type === 'send' || tx.type === 'adjustment' ? '-' : '+'}
                      {tx.amount} {tx.token}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">{tx.status}</p>
                  </div>
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
