import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const LOGIN_API = `${API_BASE}/login`;

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      const response = await fetch(LOGIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Invalid username or password');
      }

      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(result.user));

      navigate('/dashboard');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to connect to server.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#219688]/10 via-[#6CBF51]/10 to-[#EE6521]/10 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#219688]/15 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#219688] via-[#6CBF51] to-[#EE6521] px-8 py-8 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white p-4 shadow-xl">
            <img
              src="/logo/logo.png"
              alt="Company Logo"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-3xl font-extrabold text-white">Admin Login</h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Sign in to access the dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 p-8">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Username
            </label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-[#219688] focus:ring-2 focus:ring-[#219688]/20"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-[#219688] focus:ring-2 focus:ring-[#219688]/20"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p className="rounded-xl border border-[#EE6521]/20 bg-[#EE6521]/10 px-4 py-3 text-sm font-semibold text-[#EE6521]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[#EE6521] font-bold text-white shadow-lg shadow-[#EE6521]/20 transition hover:bg-[#d95518] disabled:cursor-not-allowed disabled:bg-[#EE6521]/40"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}