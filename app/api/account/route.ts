import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { isAdminEmail } from '@/lib/admin';
import { deleteAccountData } from '@/lib/account';

/** 회원 탈퇴. 같은 사이트에서 온 요청만 받는다 (CSRF 완화) */
export async function DELETE(req: NextRequest) {
  const origin = req.headers.get('origin');
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(origin) && new URL(origin!).host === req.nextUrl.host;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  if (isAdminEmail(email)) {
    return NextResponse.json({ error: '관리자 계정은 탈퇴할 수 없습니다.' }, { status: 400 });
  }
  try {
    const result = await deleteAccountData(email);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('회원 탈퇴 처리 실패', error);
    return NextResponse.json(
      { error: `탈퇴를 처리하지 못했습니다. 잠시 뒤 다시 시도하거나 이메일로 요청해 주세요.` },
      { status: 500 },
    );
  }
}
