'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Note {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_public: boolean;
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadNotes();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    await loadProfile(session.user.id);
  };

  const loadProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }
  };

  const loadNotes = async () => {
    setIsLoading(true);
    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (notesData) {
      setNotes(notesData);
    }
    setIsLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: 'new',
      title: '새 노트',
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: false
    };
    setSelectedNote(newNote);
    setTitle('새 노트');
    setContent('');
    setImagePreview(null);
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setImagePreview(note.image_url ? `https://caxvdsccyclnzpyxcytf.supabase.co/storage/v1/object/public/note-images/${note.image_url}` : null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;
    const fileName = `${Date.now()}-${image.name}`;
    const { data, error } = await supabase.storage
      .from('note-images')
      .upload(`public/${fileName}`, image);
    
    if (error) {
      console.error('Image upload error:', error);
      return null;
    }
    return data?.path || null;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    const imgPath = await uploadImage();
    
    if (selectedNote?.id === 'new') {
      const { data, error } = await supabase.from('notes').insert({
        title,
        content,
        image_url: imgPath,
        is_public: false,
      }).select().single();
      
      if (!error && data) {
        setNotes(prev => [data, ...prev]);
        setSelectedNote(data);
        alert('노트가 저장되었습니다.');
      }
    } else if (selectedNote) {
      const { error } = await supabase
        .from('notes')
        .update({
          title,
          content,
          image_url: imgPath || selectedNote.image_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedNote.id);
      
      if (!error) {
        setNotes(prev => prev.map(note => 
          note.id === selectedNote.id 
            ? { ...note, title, content, updated_at: new Date().toISOString(), image_url: imgPath || note.image_url }
            : note
        ));
        alert('노트가 업데이트되었습니다.');
      }
    }
    
    setImage(null);
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (!error) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setTitle('');
        setContent('');
        setImagePreview(null);
      }
    }
  };

  const togglePublic = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const { error } = await supabase
      .from('notes')
      .update({ is_public: !note.is_public })
      .eq('id', noteId);

    if (!error) {
      setNotes(prev => prev.map(n => 
        n.id === noteId ? { ...n, is_public: !n.is_public } : n
      ));
      if (selectedNote?.id === noteId) {
        setSelectedNote({ ...selectedNote, is_public: !selectedNote.is_public });
      }
      alert(note.is_public ? '노트가 비공개로 변경되었습니다.' : '노트가 공개되었습니다.');
    }
  };

  const copyShareLink = async (noteId: string) => {
    const shareUrl = `${window.location.origin}/note/${noteId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('공유 링크가 클립보드에 복사되었습니다!');
    } catch {
      alert(`공유 링크: ${shareUrl}`);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*, notes!inner(id)')
      .eq('is_public', true)
      .eq('notes.is_public', true)
      .ilike('username', `%${query}%`)
      .limit(10);

    setSearchResults(data || []);
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Auto-save functionality
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    if (selectedNote && selectedNote.id !== 'new' && title.trim()) {
      saveTimeoutRef.current = setTimeout(async () => {
        const { error } = await supabase
          .from('notes')
          .update({
            title,
            content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedNote.id);

        if (!error) {
          setNotes(prev => prev.map(note => 
            note.id === selectedNote.id 
              ? { ...note, title, content, updated_at: new Date().toISOString() }
              : note
          ));
        }
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, selectedNote]);

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            ☰
          </button>
          <div className="flex items-center">
            <div className="relative mr-2">
              <div className="w-8 h-6 bg-gray-200 rounded shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-5 h-4 bg-blue-500 rounded-sm transform rotate-12 translate-x-0.5 -translate-y-0.5"></div>
              </div>
            </div>
            <span className="text-lg font-light text-gray-900">cards</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="사용자명으로 검색..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div key={user.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">@{user.username}</p>
                      <p className="text-sm text-gray-600">{user.display_name}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/user/${user.username}`)}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      방문
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">@{profile?.username || 'loading'}</p>
                <p className="text-xs text-gray-500">{profile?.is_public ? '공개' : '비공개'}</p>
              </div>
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-red-600"
                  >
                    🚪 로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Left Sidebar */}
        <div className={`w-80 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:z-10 fixed md:static z-30 h-full`}>
          
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={createNewNote}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
            >
              <span className="mr-2">+</span>
              새 노트 작성
            </button>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">로딩 중...</div>
            ) : notes.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>아직 노트가 없습니다.</p>
                <p className="text-sm mt-1">새 노트를 만들어 시작해보세요!</p>
              </div>
            ) : (
              <div className="p-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-150 group ${
                      selectedNote?.id === note.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <h3 className="font-medium text-gray-900 truncate text-sm mr-2">
                            {note.title}
                          </h3>
                          {note.is_public && (
                            <span className="text-xs text-green-600">🌐</span>
                          )}
                        </div>
                        <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                          {note.content || '내용 없음'}
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          {new Date(note.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-all duration-150"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedNote ? (
            <>
              {/* Editor Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center mb-4 md:hidden">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="text-gray-600 hover:text-gray-900 mr-4"
                  >
                    ☰
                  </button>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="text-2xl font-semibold text-gray-900 bg-transparent border-none outline-none w-full placeholder-gray-400"
                />
                <div className="flex items-center mt-3 space-x-3">
                  <button
                    onClick={handleSave}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    저장
                  </button>
                  {selectedNote && selectedNote.id !== 'new' && (
                    <button
                      onClick={() => togglePublic(selectedNote.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        selectedNote.is_public 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedNote.is_public ? '🌐 공개됨' : '🔒 비공개'}
                    </button>
                  )}
                  {selectedNote && selectedNote.id !== 'new' && selectedNote.is_public && (
                    <button
                      onClick={() => copyShareLink(selectedNote.id)}
                      className="text-blue-600 hover:text-blue-800 px-3 py-2 text-sm font-medium transition-colors duration-200"
                    >
                      🔗 링크 복사
                    </button>
                  )}
                  <label className="text-gray-600 hover:text-gray-800 cursor-pointer px-3 py-2 text-sm font-medium transition-colors duration-200">
                    <input
                      type="file"
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    📎 이미지 첨부
                  </label>
                  {image && (
                    <span className="text-sm text-gray-500">
                      {image.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Editor Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="여기에 내용을 작성하세요..."
                    className="w-full min-h-[300px] resize-none border-none outline-none text-gray-900 placeholder-gray-400 text-base leading-relaxed"
                  />
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-4">
                      <div className="relative inline-block">
                        <Image
                          src={imagePreview}
                          alt="이미지 미리보기"
                          width={400}
                          height={300}
                          className="rounded-lg border border-gray-200 max-w-full h-auto"
                        />
                        <button
                          onClick={() => {
                            setImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white md:hidden">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ☰ 노트 목록
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center px-4">
                  <div className="mb-4">
                    <div className="w-16 h-12 bg-gray-200 rounded-lg shadow-sm relative overflow-hidden mx-auto">
                      <div className="absolute top-1 right-1 w-10 h-8 bg-blue-500 rounded-md transform rotate-12 translate-x-1 -translate-y-1"></div>
                    </div>
                  </div>
                  <h2 className="text-xl font-light text-gray-600 mb-2">노트를 선택하거나 새로 만들어보세요</h2>
                  <p className="text-gray-500 text-sm mb-6">왼쪽에서 노트를 클릭하거나 새 노트 버튼을 눌러 시작하세요</p>
                  <div className="space-x-4">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200 md:hidden"
                    >
                      노트 목록 보기
                    </button>
                    <button
                      onClick={createNewNote}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      새 노트 만들기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}