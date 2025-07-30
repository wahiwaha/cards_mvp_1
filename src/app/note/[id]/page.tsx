
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (!data || error) return notFound();

  const imageUrl = data.image_url
    ? `https://caxvdsccyclnzpyxcytf.supabase.co/storage/v1/object/public/note-images/${data.image_url}`
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <div className="relative mr-3">
                <div className="w-8 h-6 bg-gray-200 rounded shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-5 h-4 bg-blue-500 rounded-sm transform rotate-12 translate-x-0.5 -translate-y-0.5"></div>
                </div>
              </div>
              <span className="text-lg font-light text-gray-900">cards</span>
            </Link>
            <div className="text-sm text-gray-500">
              공유된 노트
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <article className="prose prose-lg max-w-none">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {data.title}
            </h1>
            <div className="flex items-center text-sm text-gray-500">
              <time className="mr-4">
                {new Date(data.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                공개
              </span>
            </div>
          </header>

          <div className="text-gray-800 leading-relaxed">
            {data.content.split('\n').map((paragraph: string, index: number) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          {imageUrl && (
            <div className="my-8">
              <Image 
                src={imageUrl} 
                alt="노트 이미지" 
                width={800}
                height={600}
                className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
              />
            </div>
          )}
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-gray-600 mb-4">
            이 노트가 마음에 드셨나요?
          </p>
          <Link 
            href="/signUp"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            cards에서 나만의 노트 만들기
          </Link>
        </div>
      </footer>
    </div>
  );
}