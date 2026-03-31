// app/api/lti/auth/route.js
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getPrivateKey } from '@/lib/crypto';
import * as jose from 'jose';

// Microsoft Gateway sẽ redirect về đây (có thể dùng GET hoặc POST)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri'); // Nơi Microsoft muốn nhận JWT
  const state = searchParams.get('state');
  const nonce = searchParams.get('nonce');

  const sessionUser = await getSessionUser(request);
  if (!sessionUser)
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const privateKey = await getPrivateKey();
  const keyId = process.env.LTI_KEY_ID;

  // LMS đóng vai trò OIDC Provider: Tạo id_token (JWT)
  const idToken = await new jose.SignJWT({
    iss: process.env.NEXT_PUBLIC_APP_URL, // Tên miền LMS
    aud: clientId,
    sub: sessionUser.id,
    email: sessionUser.email, // BẮT BUỘC KHỚP VỚI MICROSOFT ENTRA ID
    name: sessionUser.name,
    nonce: nonce,
    'https://purl.imsglobal.org/spec/lti/claim/message_type':
      'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': '1',
    'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': redirectUri,
    'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
      id: 'link-1',
      title: 'Microsoft 365 Integration',
    },
    // Chú ý Role: Cần role Admin cho lần khởi chạy đầu tiên
    'https://purl.imsglobal.org/spec/lti/claim/roles': [
      sessionUser.role === 'admin'
        ? 'http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator'
        : 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
    ],
    // Các tham số custom bắt buộc của Microsoft
    'https://purl.imsglobal.org/spec/lti/claim/custom': {
      t: 'Resource Title',
      dd: new Date().toISOString(),
      mp: '100',
      csid: 'course-123',
      ssid: 'section-456',
    },
  })
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);

  // Auto-submit form để bắn HTTP POST chứa id_token về lại cho Microsoft
  const html = `
    <html>
      <body onload="document.forms[0].submit()">
        <p>Đang chuyển hướng đến Microsoft 365...</p>
        <form action="${redirectUri}" method="POST">
          <input type="hidden" name="id_token" value="${idToken}" />
          <input type="hidden" name="state" value="${state}" />
        </form>
      </body>
    </html>
  `;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
