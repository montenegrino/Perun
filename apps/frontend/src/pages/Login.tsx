import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@perper/shared';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError('');
      await login(data.emailOrUsername, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-gold/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-orange/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center">
          <img
            src="https://www.perper.digital/images/perper-Logo.png"
            alt="Perper Logo"
            className="h-16 w-auto mx-auto mb-6"
          />
          <h2 className="text-4xl font-extrabold bg-gradient-gold bg-clip-text text-transparent">
            Sign in to your account
          </h2>
          <p className="mt-3 text-gray-400">
            Welcome to Perper Wallet
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-brand-gold/20">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-300 mb-2">
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                type="text"
                {...register('emailOrUsername')}
                className="w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-lg
                           text-white placeholder-gray-400
                           focus:ring-2 focus:ring-brand-gold focus:border-brand-gold
                           outline-none transition-all"
                placeholder="your@email.com or username"
              />
              {errors.emailOrUsername && (
                <p className="mt-1 text-sm text-red-400">{errors.emailOrUsername.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-lg
                           text-white placeholder-gray-400
                           focus:ring-2 focus:ring-brand-gold focus:border-brand-gold
                           outline-none transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary text-lg"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm mt-6 pt-6 border-t border-gray-700">
            <Link to="/register" className="text-brand-gold hover:text-brand-orange transition-colors">
              Create an account
            </Link>
            <Link to="/forgot-password" className="text-gray-400 hover:text-brand-gold transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
