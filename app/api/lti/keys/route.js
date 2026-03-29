// app/api/lti/keys/route.js
// ============================================================
// JWKS ENDPOINT — Public Key của Education Hub (Platform)
//
// ĐÚNG VAI TRÒ:
//   Khi Education Hub đăng ký làm Platform trên MS LTI Gateway,
//   Gateway cần biết Public Key của ta để:
//     1. Verify các request ký bởi Education Hub
//     2. Encrypt dữ liệu gửi về cho Education Hub (nếu cần)
//
//   Khi đăng ký trên MS LTI Gateway Admin Portal, ta điền
//   URL này vào trường "Platform Public JWK Set URL" hoặc
//   "Keyset URL" của Platform registration.
//
// Microsoft LTI Gateway gọi GET endpoint này để lấy key.
// ============================================================
import { NextResponse } from 'next/server';
import { getJWKS } from '@/lib/crypto';

export async function GET() {
  try {
    const jwks = await getJWKS();

    return NextResponse.json(jwks, {
      status: 200,
      headers: {
        // Cache 1 giờ — key ít khi thay đổi
        'Cache-Control': 'public, max-age=3600',
        // Cho phép MS Gateway fetch cross-origin
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[JWKS] Lỗi:', error);
    return NextResponse.json(
      {
        error: 'key_error',
        message: 'Không thể tải public key. Kiểm tra LTI_PRIVATE_KEY.',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
