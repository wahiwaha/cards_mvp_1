'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (username.length < 3 || username.length > 30) {
      alert('사용자명은 3-30자 사이여야 합니다.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      alert('사용자명은 영문, 숫자, 언더스코어(_)만 사용 가능합니다.');
      return;
    }

    setIsLoading(true);
    
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('API Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: username,
            display_name: displayName || username,
            is_public: true
          }
        }
      });
      
      console.log('SignUp response:', { data, error });
      
      if (!error) {
        alert('회원가입 성공! 이메일을 확인해주세요.');
        router.push('/login');
      } else {
        console.error('SignUp error details:', error);
        alert(`회원가입 오류: ${error.message}\n\n상세: ${JSON.stringify(error, null, 2)}`);
      }
    } catch (err) {
      console.error('SignUp catch error:', err);
      alert(`네트워크 오류: ${err}`);
    }
    
    setIsLoading(false);
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
          <p className="text-gray-500 text-sm">새로운 계정을 만들어 시작하세요</p>
        </div>

        {/* SignUp Form */}
        <form onSubmit={signUp} className="space-y-6">
          <div className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="사용자명 (3-30자, 영문/숫자/_만 가능)"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="표시 이름 (선택사항)"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 (최소 6자)"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 확인"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !username || !password || !confirmPassword}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>

          <div className="text-center">
            <span className="text-gray-500 text-sm">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
              로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}