// app/api/lti/launch/route.js
// ============================================================
// LTI LAUNCH INITIATOR — Education Hub (Platform) chủ động
// khởi động quá trình mở một Microsoft Tool cho user.
//
// ĐÚNG VAI TRÒ:
//   Education Hub = Platform → CHỦ ĐỘNG gọi sang MS Gateway
//   Không phải bị động ngồi chờ MS gọi vào.
//
// Flow đúng:
//   1. User bấm nút "Mở OneDrive" trong Education Hub
//   2. FE gọi POST /api/lti/launch?toolId=xxx
//   3. API này tạo nonce+state, build OIDC request
//   4. Redirect user đến MS LTI Gateway để xác thực
//   5. MS Gateway xác thực xong → POST id_token về /api/lti/callback
//
// Endpoint này thay thế hoàn toàn /api/lti/login cũ
// (vì cái cũ đang implement Tool behavior, không phải Platform)
// ============================================================
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LtiRegistration from '@/models/LtiRegistration';
import LtiNonce from '@/models/LtiNonce';
import { generateSecureRandom } from '@/lib/crypto';
import { getSessionUser } from '@/lib/session';

export async function POST(request) {
  try {
    // ── 1. XÁC ĐỊNH TOOL MUỐN MỞ ───────────────────────────
    // FE gửi lên toolId (ObjectId của LtiRegistration)
    // hoặc toolType ("onedrive", "teams"...)
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');
    const toolType = searchParams.get('toolType');

    if (!toolId && !toolType) {
      return NextResponse.json(
        { error: 'missing_tool', message: 'Cần truyền toolId hoặc toolType' },
        { status: 400 },
      );
    }

    // ── 2. LẤY SESSION USER (ai đang dùng Education Hub) ───
    // Platform cần biết user là ai để sau này map với MS account
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json(
        {
          error: 'unauthenticated',
          message: 'Vui lòng đăng nhập Education Hub trước',
        },
        { status: 401 },
      );
    }

    // ── 3. TÌM REGISTRATION CỦA TOOL MUỐN MỞ ──────────────
    await connectToDatabase();

    const query = toolId
      ? { _id: toolId, isActive: true }
      : { toolType, isActive: true };

    const registration = await LtiRegistration.findOne(query).lean();

    if (!registration) {
      return NextResponse.json(
        {
          error: 'tool_not_found',
          message: `Không tìm thấy cấu hình tool: ${toolId || toolType}`,
        },
        { status: 404 },
      );
    }

    // ── 4. TẠO NONCE + STATE ────────────────────────────────
    // Education Hub (Platform) tự tạo nonce+state
    // để bảo vệ flow của chính mình
    const nonce = generateSecureRandom(32); // 64 hex chars
    const state = generateSecureRandom(32);

    await LtiNonce.create({
      nonce,
      state,
      clientId: registration.clientId,
      targetLinkUri: registration.targetLinkUri,
      userId: sessionUser.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // ── 5. BUILD OIDC AUTHORIZATION REQUEST ────────────────
    // Education Hub (Platform) gửi OIDC request đến
    // Microsoft LTI Gateway để bắt đầu LTI launch
    const authUrl = new URL(registration.authorizationEndpoint);

    // Thông tin Platform tự khai báo với Gateway
    authUrl.searchParams.set('scope', 'openid');
    authUrl.searchParams.set('response_type', 'id_token');

    // form_post: Gateway sẽ POST id_token về callback URL của ta
    authUrl.searchParams.set('response_mode', 'form_post');

    // Client ID của Education Hub trên Gateway
    authUrl.searchParams.set('client_id', registration.clientId);

    // Callback URL — nơi Gateway gửi JWT về sau khi xác thực
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/lti/callback`;
    authUrl.searchParams.set('redirect_uri', callbackUrl);

    // Tool URL muốn mở
    authUrl.searchParams.set('target_link_uri', registration.targetLinkUri);

    // Bảo mật
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('state', state);

    // Login hint: gợi ý cho Gateway biết user là ai (email MS account)
    if (sessionUser.email) {
      authUrl.searchParams.set('login_hint', sessionUser.email);
    }

    // Deployment ID của tool
    if (registration.deploymentId) {
      authUrl.searchParams.set('lti_deployment_id', registration.deploymentId);
    }

    console.log(
      `[LTI Launch] User ${sessionUser.email} mở tool: ${registration.name}`,
    );
    console.log(`[LTI Launch] Redirect to: ${authUrl.toString()}`);

    // ── 6. REDIRECT USER ĐẾN MICROSOFT LTI GATEWAY ─────────
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('[LTI Launch] Lỗi:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        message: 'Lỗi khi khởi động LTI launch',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
