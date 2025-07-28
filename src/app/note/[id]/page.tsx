import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;

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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{data.title}</h1>
      <p className="mb-4 whitespace-pre-wrap">{data.content}</p>
      {imageUrl && (
        <img src={imageUrl} alt="note image" className="max-w-md border" />
      )}
    </div>
  );
}