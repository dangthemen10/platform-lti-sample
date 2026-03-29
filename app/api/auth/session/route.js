// app/api/auth/session/route.js
// ============================================================
// API lấy thông tin user hiện tại từ session cookie.
// Dashboard gọi endpoint này để biết user là ai.
// ============================================================
import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/crypto';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Đọc cookie session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('edu_session');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'unauthenticated', message: 'Chưa đăng nhập' },
        { status: 401 },
      );
    }

    // Verify và decode session token
    const payload = await verifySessionToken(sessionCookie.value);

    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        avatarUrl: payload.avatarUrl,
        contextTitle: payload.contextTitle,
      },
    });
  } catch (error) {
    console.error('[Session] Lỗi verify session:', error.message);

    return NextResponse.json(
      {
        error: 'invalid_session',
        message: 'Session không hợp lệ hoặc đã hết hạn',
      },
      { status: 401 },
    );
  }
}

// Logout: Xóa session cookie
export async function DELETE() {
  const response = NextResponse.json({ message: 'Đã đăng xuất thành công' });

  response.cookies.set('edu_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Xóa cookie ngay lập tức
    path: '/',
  });

  return response;
}
