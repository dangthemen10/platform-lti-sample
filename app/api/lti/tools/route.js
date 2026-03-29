// app/api/lti/tools/route.js
// ============================================================
// Trả danh sách Microsoft Tools đang active trong hệ thống.
// Dashboard gọi endpoint này để hiển thị danh sách tool
// mà user có thể mở từ Education Hub (Platform).
// ============================================================
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LtiRegistration from '@/models/LtiRegistration';
import { getSessionUser } from '@/lib/session';

export async function GET(request) {
  try {
    // Chỉ user đã đăng nhập mới xem được danh sách tool
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    await connectToDatabase();

    // Lấy tất cả tool đang active
    const tools = await LtiRegistration.find({ isActive: true })
      .select('name toolType targetLinkUri deploymentId createdAt')
      .lean();

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('[Tools API] Lỗi:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Không thể tải danh sách tool' },
      { status: 500 },
    );
  }
}
