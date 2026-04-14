'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await signIn('credentials', {
          redirect: false,
          username: formData.username,
          password: formData.password
        });

        if (res?.error) {
          setError('Tên đăng nhập hoặc mật khẩu không chính xác');
        } else {
          router.push('/');
          router.refresh();
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Mật khẩu xác nhận không khớp');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password
          })
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Có lỗi xảy ra khi đăng ký');
        } else {
          await signIn('credentials', {
            redirect: false,
            username: formData.username,
            password: formData.password
          });
          router.push('/');
          router.refresh();
        }
      }
    } catch (err) {
      setError('Đã xảy ra lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GlassCard>
          <div className="text-center mb-8">
            <h1 className="text-3xl mb-2 text-[#082F49]">Hành Trình Khám Phá</h1>
            <p className="text-[#94A3B8]">
              {isLogin ? 'Đăng nhập để tiếp tục cuộc phiêu lưu' : 'Tạo tài khoản để bắt đầu ngay'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Tên đăng nhập" 
              name="username"
              type="text" 
              placeholder="Nhập tên đăng nhập..." 
              required
              value={formData.username}
              onChange={handleChange}
            />
            <Input 
              label="Mật khẩu" 
              name="password"
              type="password" 
              placeholder="Nhập mật khẩu..." 
              required 
              value={formData.password}
              onChange={handleChange}
            />
            
            {!isLogin && (
              <Input 
                label="Xác nhận mật khẩu" 
                name="confirmPassword"
                type="password" 
                placeholder="Nhập lại mật khẩu..." 
                required 
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            )}

            {error && (
              <div className="p-3 mt-4 text-sm text-[#DC2626] bg-[rgba(254,226,226,0.8)] backdrop-blur-md rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-[#94A3B8]">
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            </span>
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-[#06B6D4] font-bold hover:underline focus:outline-none"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
