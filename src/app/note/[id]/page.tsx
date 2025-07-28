import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic'; // 정적 아닌 동적 렌더링 지정

interface NotePageProps {
  params: {
    id: string;
  };
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = params;

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (!data || error) {
    return notFound();
  }

  const imageUrl = data.image_url
    ? `https://caxvdsccyclnzpyxcytf.supabase.co/storage/v1/object/public/note-images/${data.image_url}`
    : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{data.title}</h1>
      <p className="mb-4 whitespace-pre-wrap">{data.content}</p>
      {imageUrl && (
        // 경고 무시: Next.js는 <Image> 권장하지만 <img>도 작동함
        <img src={imageUrl} alt="note image" className="max-w-md border" />
      )}
    </div>
  );
}