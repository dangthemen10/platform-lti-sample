// app/api/lti/callback/route.js
// ============================================================
// LTI CALLBACK — Nhận JWT từ Microsoft LTI Gateway gửi về.
//
// ĐÚNG VAI TRÒ:
//   Đây là điểm cuối của OIDC flow mà Education Hub (Platform)
//   đã khởi động từ /api/lti/launch.
//
//   Microsoft LTI Gateway POST id_token về đây sau khi
//   xác thực user với Microsoft account thành công.
//
// Sau khi verify JWT thành công:
//   - Biết user đã được Microsoft xác thực
//   - Có thể mở Tool (OneDrive/Teams) cho user
//   - Lưu microsoft_sub vào User record để liên kết tài khoản
// ============================================================
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LtiRegistration from '@/models/LtiRegistration';
import LtiNonce from '@/models/LtiNonce';
import User from '@/models/User';
import { verifyMicrosoftJWT } from '@/lib/crypto';

// Chỉ nhận POST — Gateway dùng form_post response mode
export async function POST(request) {
  try {
    // ── 1. PARSE FORM DATA TỪ GATEWAY ───────────────────────
    const formData = await request.formData().catch(() => null);

    if (!formData) {
      return errorPage('Không thể đọc response từ Microsoft LTI Gateway');
    }

    const idToken = formData.get('id_token');
    const state = formData.get('state');

    if (!idToken || !state) {
      return errorPage('Thiếu id_token hoặc state trong response');
    }

    // ── 2. VERIFY STATE — CHỐNG CSRF ────────────────────────
    await connectToDatabase();

    const nonceRecord = await LtiNonce.findOne({ state, isUsed: false });

    if (!nonceRecord) {
      console.error(`[LTI Callback] State không hợp lệ hoặc đã dùng: ${state}`);
      return errorPage('State không hợp lệ. Phiên làm việc có thể đã hết hạn.');
    }

    if (new Date() > nonceRecord.expiresAt) {
      await LtiNonce.deleteOne({ _id: nonceRecord._id });
      return errorPage('Phiên LTI đã hết hạn. Vui lòng thử lại.');
    }

    // ── 3. LẤY REGISTRATION ĐỂ VERIFY JWT ──────────────────
    const registration = await LtiRegistration.findOne({
      clientId: nonceRecord.clientId,
      isActive: true,
    }).lean();

    if (!registration) {
      return errorPage('Không tìm thấy cấu hình tool tương ứng');
    }

    // ── 4. VERIFY JWT BẰNG PUBLIC KEY CỦA MS GATEWAY ───────
    // Gateway dùng private key của họ ký JWT
    // Ta dùng JWKS URI của Gateway để lấy public key verify
    let payload;
    try {
      const result = await verifyMicrosoftJWT(idToken, registration);
      payload = result.payload;
    } catch (jwtError) {
      console.error('[LTI Callback] Verify JWT thất bại:', jwtError.message);
      return errorPage(`Xác thực JWT thất bại: ${jwtError.message}`);
    }

    // ── 5. VERIFY NONCE — CHỐNG REPLAY ATTACK ───────────────
    if (payload.nonce !== nonceRecord.nonce) {
      console.error('[LTI Callback] Nonce không khớp');
      return errorPage('Nonce không khớp. Yêu cầu không hợp lệ.');
    }

    // Đánh dấu nonce đã dùng — không thể dùng lại
    await LtiNonce.findByIdAndUpdate(nonceRecord._id, { isUsed: true });

    // ── 6. TRÍCH XUẤT THÔNG TIN TỪ JWT PAYLOAD ─────────────
    // JWT từ Gateway chứa thông tin về user và tool context
    const LTI_CLAIM = 'https://purl.imsglobal.org/spec/lti/claim';

    const microsoftSub = payload.sub;
    const userEmail = payload.email;
    const messageType = payload[`${LTI_CLAIM}/message_type`];
    const resourceLink = payload[`${LTI_CLAIM}/resource_link`] || {};
    const targetLinkUri =
      payload[`${LTI_CLAIM}/target_link_uri`] || nonceRecord.targetLinkUri;

    console.log(`[LTI Callback] Launch thành công:`, {
      tool: registration.name,
      messageType,
      targetLinkUri,
      userEmail,
    });

    // ── 7. CẬP NHẬT USER — LIÊN KẾT MS ACCOUNT ─────────────
    // Lưu microsoftSub để biết Education Hub user này
    // đã liên kết với Microsoft account nào
    if (nonceRecord.userId) {
      await User.findByIdAndUpdate(nonceRecord.userId, {
        $set: {
          microsoftSub,
          lastLoginAt: new Date(),
        },
      });
    }

    // ── 8. REDIRECT USER ĐẾN TOOL URL ───────────────────────
    // Sau khi xác thực thành công, redirect user đến
    // URL thực của Microsoft Tool (OneDrive, Teams...)
    if (!targetLinkUri) {
      return errorPage('Không tìm thấy URL của tool Microsoft');
    }

    // Thêm query params nếu tool cần (tuỳ loại tool)
    const toolUrl = new URL(targetLinkUri);

    console.log(`[LTI Callback] Redirect user đến tool: ${toolUrl.toString()}`);

    return NextResponse.redirect(toolUrl.toString());
  } catch (error) {
    console.error('[LTI Callback] Lỗi không mong đợi:', error);
    return errorPage('Lỗi server. Vui lòng thử lại.');
  }
}

// ── HELPER: Trả về trang lỗi thân thiện thay vì JSON ────────
// Vì endpoint này nhận redirect từ Microsoft, trả HTML đẹp hơn JSON
function errorPage(message) {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Lỗi LTI</title>
      <style>
        body { font-family: sans-serif; display: flex; align-items: center;
               justify-content: center; min-height: 100vh; margin: 0;
               background: #f8fafc; }
        .card { background: white; border-radius: 12px; padding: 2rem;
                max-width: 400px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h2 { color: #e53e3e; margin-top: 0; }
        p { color: #4a5568; }
        a { color: #3182ce; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Không thể mở tool</h2>
        <p>${message}</p>
        <p><a href="/">Quay về Education Hub</a></p>
      </div>
    </body>
    </html>
  `;
  return new Response(html, {
    status: 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
