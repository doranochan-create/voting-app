import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: '環境変数が設定されていません。' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const { optionId } = await request.json();

    if (!optionId) {
      return NextResponse.json({ error: '選択肢が指定されていません。' }, { status: 400 });
    }

    // 1. VPN / プロキシチェック
    if (process.env.IPINFO_TOKEN) {
      const vpnRes = await fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`);
      const ipData = await vpnRes.json();
      if (ipData.privacy?.vpn || ipData.privacy?.proxy || ipData.privacy?.tor) {
        return NextResponse.json({ error: 'VPNまたはプロキシ経由の投票は許可されていません。' }, { status: 403 });
      }
    }

    // 2. IP重複チェック（24時間以内）
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingVotes } = await supabase
      .from('vote_logs')
      .select('id')
      .eq('ip_address', ip)
      .gte('created_at', twentyFourHoursAgo);

    if (existingVotes && existingVotes.length > 0) {
      return NextResponse.json({ error: 'このIPアドレスからは24時間以内に既に投票されています。' }, { status: 400 });
    }

    // 3. ログ記録 ＆ カウント更新
    await supabase.from('vote_logs').insert([{ option_id: optionId, ip_address: ip }]);
    await supabase.rpc('increment_vote', { option_id_input: optionId });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
