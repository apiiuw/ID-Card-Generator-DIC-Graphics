import React, { useState } from 'react';
import { UserSession } from '../types';
import { Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle, Database, Loader2 } from 'lucide-react';
import { loginUser } from '../utils/api';

interface LoginViewProps {
  onLogin: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim();

    if (!trimmedUser) {
      setError('Silakan masukkan Nama Pengguna (Username).');
      return;
    }
    if (!password) {
      setError('Silakan masukkan Kata Sandi (Password).');
      return;
    }

    setLoading(true);
    try {
      // Authenticate directly against MySQL database
      const session = await loginUser(trimmedUser, password);
      onLogin(session);
    } catch (err: any) {
      setError(err.message || 'Nama pengguna atau kata sandi salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center items-center p-4">
      {/* Background Decorative Rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header / Brand Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-8 text-white text-center relative">
            {/* Logos */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="bg-white p-2 rounded-xl shadow-md flex items-center justify-center w-28 h-12">
                <img
                  src="/logos/dic-logo.jpg"
                  alt="PT DIC Graphics"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="bg-white p-2 rounded-xl shadow-md flex items-center justify-center w-12 h-12">
                <img
                  src="/logos/k3-logo.jpg"
                  alt="K3 Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            <h1 className="text-xl font-bold tracking-tight">PT DIC GRAPHICS</h1>
            <p className="text-xs text-blue-200 mt-1 font-medium tracking-wide">
              KARAWANG FACTORY • ID CARD GENERATOR
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] text-blue-100 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-green-300" />
              Sistem Manajemen Batch & Cetak K3
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Masuk ke Akun</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan kredensial resmi untuk mengakses sistem ID Card
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Pengguna (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    autoComplete="off"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Ingat saya di perangkat ini
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Database MySQL...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="px-8 py-3.5 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} PT DIC Graphics Karawang. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
