import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (data.success) {
        onSuccess(data.user);
      } else {
        setError(data.message || 'Đã có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi kết nối đến máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-emerald-200 rounded-2xl max-w-md w-full p-8 card-shadow-lg text-emerald-950 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-emerald-950">
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <p className="text-sm text-emerald-600 mt-2">
            {isLogin 
              ? 'Chào mừng trở lại với hệ thống gợi ý món ăn SmartMeal.'
              : 'Gia nhập SmartMeal để quản lý thực đơn thông minh hơn.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {!isLogin && (
            <div>
              <label className="block text-emerald-950 font-semibold mb-1.5">Họ và tên</label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 placeholder-emerald-400 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-emerald-950 font-semibold mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 placeholder-emerald-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-emerald-950 font-semibold mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 placeholder-emerald-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</span>}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-emerald-600 font-medium">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="font-bold text-emerald-950 hover:underline"
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};
