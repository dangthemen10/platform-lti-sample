// lib/session.js
// ============================================================
// Tiện ích quản lý session của Education Hub.
// User đăng nhập Education Hub bằng credential riêng của Platform —
// KHÔNG phải đăng nhập bằng Microsoft account ở bước này.
// Microsoft account chỉ được dùng khi mở MS Tool qua LTI.
// ============================================================
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/crypto';

/**
 * Lấy thông tin user đang đăng nhập Education Hub.
 * Đọc từ session cookie `edu_session`.
 *
 * @returns {Object|null} user payload hoặc null nếu chưa đăng nhập
 */
export async function getSessionUser(request) {
  try {
    let token = null;

    // Ưu tiên đọc từ cookie store (Server Component / Route Handler)
    if (!request) {
      const cookieStore = cookies();
      token = cookieStore.get('edu_session')?.value;
    } else {
      // Đọc từ request cookie header
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/edu_session=([^;]+)/);
      token = match ? match[1] : null;
    }

    if (!token) return null;

    const payload = await verifySessionToken(token);
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
