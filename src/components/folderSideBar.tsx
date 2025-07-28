'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Folder = {
  id: string;
  name: string;
};

type Props = {
  onSelectFolder: (id: string) => void;
};

export default function FolderSidebar({ onSelectFolder }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    const fetchFolders = async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name'); // 필드를 명시적으로 지정

      if (error) {
        console.error('폴더 가져오기 오류:', error.message);
        return;
      }

      // 타입이 일치하지 않을 경우 data는 null일 수 있음
      setFolders(data ?? []);
    };

    fetchFolders();
  }, []);

  return (
    <div>
      {folders.map((folder) => (
        <div key={folder.id} onClick={() => onSelectFolder(folder.id)}>
          {folder.name}
        </div>
      ))}
    </div>
  );
}