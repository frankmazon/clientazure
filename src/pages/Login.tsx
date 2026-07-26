import { useState } from 'react';
import {
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldAlt,
  FaUser,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const LOGIN_API = `${API_BASE}/login`;

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      navigate('/dashboard/client-search');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to connect to server.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f8f7] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#219688]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#EE6521]/15 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#219688_0%,#176b67_48%,#163143_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[45px] border-white/5" />
          <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[#EE6521]/20 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2.5 shadow-xl">
              <img
                src="/logo/logo.png"
                alt="Company Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                Secure workspace
              </p>
              <p className="mt-1 text-lg font-extrabold">SBR Funding</p>
            </div>
          </div>

          <div className="relative">
            <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <FaShieldAlt className="text-xl text-[#8bd07b]" />
            </span>
            <h1 className="max-w-md text-4xl font-black leading-tight">
              Everything you need to manage your clients.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/70">
              Access applications, supporting documents, and client records
              from one secure dashboard.
            </p>
          </div>

          <div className="relative flex items-center gap-3 text-sm text-white/60">
            <span className="h-px w-10 bg-white/30" />
            Protected administrative access
          </div>
        </section>

        <section className="flex items-center px-6 py-8 sm:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200">
                <img
                  src="/logo/logo.png"
                  alt="Company Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#219688]">
              Admin portal
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Welcome back
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your account details to continue to the dashboard.
            </p>

            <form onSubmit={handleLogin} className="mt-9 space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Username
                </label>
                <div className="relative">
                  <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                  <input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#219688] focus:bg-white focus:ring-4 focus:ring-[#219688]/10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#219688] focus:bg-white focus:ring-4 focus:ring-[#219688]/10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-[#219688] focus:outline-none focus:ring-2 focus:ring-[#219688]/20"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-[#EE6521]/20 bg-[#EE6521]/10 px-4 py-3 text-sm font-semibold text-[#c94d14]"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#EE6521] font-bold text-white shadow-[0_12px_24px_rgba(238,101,33,0.25)] transition hover:-translate-y-0.5 hover:bg-[#d95518] hover:shadow-[0_16px_30px_rgba(238,101,33,0.3)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-[#EE6521]/40 disabled:shadow-none"
              >
                <span>{loading ? 'Signing in...' : 'Sign in securely'}</span>
                {!loading && (
                  <FaArrowRight className="text-sm transition group-hover:translate-x-1" />
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
              <FaShieldAlt className="text-[#219688]" />
              Your session is protected and encrypted
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
