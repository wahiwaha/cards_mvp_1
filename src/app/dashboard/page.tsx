'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const uploadImage = async () => {
    if (!image) return null;
    const { data } = await supabase.storage
      .from('note-images')
      .upload(`public/${image.name}`, image);
    return data?.path || null;
  };

  const handleSave = async () => {
    const imgPath = await uploadImage();
    await supabase.from('notes').insert({
      title,
      content,
      image_url: imgPath,
      is_public: false,
    });
    alert('노트 저장 완료');
  };

  return (
    <div className="p-4">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="border p-2" />
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용" className="border p-2" />
      <input type="file" onChange={e => setImage(e.target.files?.[0] || null)} />
      <button onClick={handleSave} className="bg-green-500 p-2 mt-2 text-white">노트 저장</button>
    </div>
  );
}