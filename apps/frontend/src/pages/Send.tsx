import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendTokensSchema, TokenSymbol, ALL_TOKENS } from '@perper/shared';
import { walletApi } from '../services/api';
import { nanoid } from 'nanoid';
import { useQueryClient } from '@tanstack/react-query';

export default function Send() {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(sendTokensSchema),
    defaultValues: {
      idempotencyKey: nanoid()
    }
  });

  const onSubmit = async (data: any) => {
    try {
      setError('');
      setSuccess('');
      const response = await walletApi.sendTokens(data);
      setSuccess(response.data.message);
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      reset({ idempotencyKey: nanoid() });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Transfer failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Send Tokens</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              Token
            </label>
            <select
              id="token"
              {...register('token')}
              className="input-field"
            >
              <option value="">Select token</option>
              {ALL_TOKENS.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
            {errors.token && (
              <p className="mt-1 text-sm text-red-600">{errors.token.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient
            </label>
            <input
              id="to"
              type="text"
              {...register('to')}
              className="input-field"
              placeholder="Username, email, or wallet address"
            />
            {errors.to && (
              <p className="mt-1 text-sm text-red-600">{errors.to.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className="input-field"
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
              Note (optional)
            </label>
            <textarea
              id="note"
              {...register('note')}
              className="input-field"
              rows={3}
              placeholder="Add a note to this transaction"
            />
            {errors.note && (
              <p className="mt-1 text-sm text-red-600">{errors.note.message}</p>
            )}
          </div>

          <input type="hidden" {...register('idempotencyKey')} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary"
          >
            {isSubmitting ? 'Sending...' : 'Send Tokens'}
          </button>
        </form>
      </div>
    </div>
  );
}
