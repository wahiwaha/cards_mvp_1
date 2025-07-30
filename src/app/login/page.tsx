'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      router.push('/dashboard');
    } else {
      alert(error.message);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      login();
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-12 bg-gray-200 rounded-lg shadow-sm relative overflow-hidden">
                <div className="absolute top-1 right-1 w-10 h-8 bg-blue-500 rounded-md transform rotate-12 translate-x-1 -translate-y-1"></div>
              </div>
            </div>
            <h1 className="ml-3 text-3xl font-light text-gray-900">cards</h1>
          </div>
          <p className="text-gray-500 text-sm">간단하고 세련된 노트 정리 플랫폼</p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="이메일"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="비밀번호"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            onClick={login}
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          <div className="text-center">
            <span className="text-gray-500 text-sm">계정이 없으신가요? </span>
            <Link href="/signUp" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}