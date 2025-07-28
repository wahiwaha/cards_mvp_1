'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const router = useRouter();

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (!error) router.push('/dashboard');
    else alert(error.message);
  };

  return (
    <div className="p-8">
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일" className="border p-2" />
      <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="비밀번호" className="border p-2" />
      <button onClick={login} className="bg-blue-500 text-white p-2 mt-2">로그인</button>
    </div>
  );
}