'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">📐</div>
            <h1 className="text-xl font-semibold">인류 진화와 질병</h1>
          </div>
          <div className="space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center">
          <div className="text-6xl mb-8">📐</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            인류 진화와 질병
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            학술적 노트 작성을 위한 깔끔하고 기능적인 워크스페이스. 
            문서를 작성하고, 이미지를 삽입하며, 다른 사용자와 공유하세요.
          </p>
          <div className="space-x-4">
            <Link
              href="/signup"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              시작하기
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              로그인
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-3xl mb-4">✍️</div>
            <h3 className="text-lg font-semibold mb-2">풍부한 편집기</h3>
            <p className="text-gray-600">
              텍스트와 이미지를 자유롭게 편집하고 구성하세요.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-3xl mb-4">🤝</div>
            <h3 className="text-lg font-semibold mb-2">협업과 공유</h3>
            <p className="text-gray-600">
              문서를 다른 사용자와 공유하고 함께 작업하세요.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">강력한 검색</h3>
            <p className="text-gray-600">
              문서 내용과 사용자를 빠르게 검색할 수 있습니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}