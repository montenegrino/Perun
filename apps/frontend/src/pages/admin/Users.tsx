import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', statusFilter],
    queryFn: async () => {
      const response = await adminApi.getUsers({ status: statusFilter, size: 100 });
      return response.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => adminApi.approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => adminApi.rejectUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => adminApi.suspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => adminApi.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>

      {/* Status Filter */}
      <div className="flex space-x-2">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded ${
            statusFilter === 'pending' ? 'bg-perper-gold text-white' : 'bg-gray-200'
          }`}
        >
          Pending ({data?.users.filter((u: any) => u.status === 'pending').length || 0})
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-4 py-2 rounded ${
            statusFilter === 'approved' ? 'bg-perper-gold text-white' : 'bg-gray-200'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter('suspended')}
          className={`px-4 py-2 rounded ${
            statusFilter === 'suspended' ? 'bg-perper-gold text-white' : 'bg-gray-200'
          }`}
        >
          Suspended
        </button>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.users.map((user: any) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        user.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {user.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(user.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(user.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {user.status === 'approved' && (
                      <button
                        onClick={() => suspendMutation.mutate(user.id)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        Suspend
                      </button>
                    )}
                    {user.status === 'suspended' && (
                      <button
                        onClick={() => activateMutation.mutate(user.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
