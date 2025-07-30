import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface Note {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  is_public: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  is_public: boolean;
  notes: Note[];
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      notes(id, title, content, image_url, created_at, is_public)
    `)
    .eq('username', username)
    .eq('is_public', true)
    .single();

  if (!profile || error) {
    return notFound();
  }

  // 공개 노트만 필터링
  const publicNotes = profile.notes?.filter((note: Note) => note.is_public) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center">
              <div className="relative mr-3">
                <div className="w-8 h-6 bg-gray-200 rounded shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-5 h-4 bg-blue-500 rounded-sm transform rotate-12 translate-x-0.5 -translate-y-0.5"></div>
                </div>
              </div>
              <span className="text-lg font-light text-gray-900">cards</span>
            </Link>
            <Link 
              href="/dashboard"
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              내 대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.display_name}
              </h1>
              <p className="text-xl text-gray-600 mb-3">@{profile.username}</p>
              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>{publicNotes.length}개의 공개 노트</span>
                <span>계정 공개</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicNotes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">아직 공개된 노트가 없습니다.</p>
            </div>
          ) : (
            publicNotes.map((note: Note) => (
              <Link
                key={note.id}
                href={`/note/${note.id}`}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {note.content || '내용 없음'}
                  </p>
                  
                  {note.image_url && (
                    <div className="mb-4">
                      <Image
                        src={`https://caxvdsccyclnzpyxcytf.supabase.co/storage/v1/object/public/note-images/${note.image_url}`}
                        alt="노트 이미지"
                        width={300}
                        height={180}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <time>
                      {new Date(note.created_at).toLocaleDateString('ko-KR')}
                    </time>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      공개
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <p className="text-gray-600 mb-4">
            이런 멋진 노트들이 마음에 드셨나요?
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