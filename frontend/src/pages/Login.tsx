import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'doctor') navigate('/doctor');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-surface">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-secondary-container/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
      </div>
      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-2 font-headline">CHARS</h1>
        </div>
        <div className="bg-surface-container-lowest rounded-xl shadow-2xl p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-on-surface tracking-tight mb-2 font-headline">Welcome Back</h2>
            <p className="text-on-surface-variant text-sm">Please enter your credentials to access the clinical portal.</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wider block" htmlFor="email">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-base">mail</span>
                </div>
                <input
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-low border-none rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary-container/40 focus:bg-surface-container-lowest transition-all duration-200 outline-none"
                  id="email"
                  name="email"
                  placeholder="name@clinic.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-on-surface-variant tracking-wider block" htmlFor="password">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-base">lock</span>
                </div>
                <input
                  className="w-full pl-11 pr-10 py-3 bg-surface-container-low border-none rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary-container/40 focus:bg-surface-container-lowest transition-all duration-200 outline-none"
                  id="password"
                  name="password"
                  placeholder="********"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-error font-semibold">{error}</p>}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-lg font-bold text-base tracking-wide shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login'}
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
