'use client';

import { useEffect, useState } from 'react';

type Option = {
  id: number;
  title: string;
  votes_count: number;
};

export default function Home() {
  const [options, setOptions] = useState<Option[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchOptions = async () => {
    const res = await fetch('/api/options');
    if (res.ok) {
      const data = await res.json();
      setOptions(data);
    }
  };

  useEffect(() => {
    fetchOptions();
    if (localStorage.getItem('has_voted_poll')) {
      setHasVoted(true);
    }
  }, []);

  const handleVote = async (optionId: number) => {
    if (hasVoted) {
      setMessage('既に投票済みです（ブラウザ制限）。');
      return;
    }

    setLoading(true);
    setMessage('');

    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      localStorage.setItem('has_voted_poll', 'true');
      setHasVoted(true);
      setMessage('投票が完了しました！');
      fetchOptions();
    } else {
      setMessage(data.error || '投票に失敗しました。');
    }
  };

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes_count, 0);

  return (
    <main style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', fontSize: '24px', marginBottom: '20px' }}>人気投票</h1>

      {message && (
        <div style={{ padding: '10px', marginBottom: '15px', background: '#f0f0f0', borderRadius: '5px', textAlign: 'center' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {options.map((opt) => {
          const percent = totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0;
          return (
            <div key={opt.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' }}>
                <span>{opt.title}</span>
                <span>{opt.votes_count} 票 ({percent}%)</span>
              </div>
              
              <div style={{ background: '#eee', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ background: '#0070f3', width: `${percent}%`, height: '100%' }} />
              </div>

              <button
                onClick={() => handleVote(opt.id)}
                disabled={hasVoted || loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: hasVoted ? '#ccc' : '#0070f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: hasVoted ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {hasVoted ? '投票済み' : '投票する'}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
