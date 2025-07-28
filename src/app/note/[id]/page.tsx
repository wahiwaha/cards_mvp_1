import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic'; // 동적 렌더링을 강제로 설정

export default async function NotePage({ params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', params.id)
    .eq('is_public', true)
    .single();

  if (!data || error) {
    return notFound(); // 404 페이지
  }

  const imageUrl = data.image_url
    ? `https://caxvdsccyclnzpyxcytf.supabase.co/storage/v1/object/public/note-images/${data.image_url}`
    : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{data.title}</h1>
      <p className="mb-4 whitespace-pre-wrap">{data.content}</p>
      {imageUrl && (
        <img src={imageUrl} alt="노트 이미지" className="max-w-md border" />
      )}
    </div>
  );
}