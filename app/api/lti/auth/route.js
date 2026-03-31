// app/api/lti/auth/route.js
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getPrivateKey } from '@/lib/crypto';
import * as jose from 'jose';

// Microsoft có thể gửi OIDC request thông qua GET hoặc POST, ta xử lý cả 2
export async function GET(request) {
  return handleAuthRequest(request);
}
export async function POST(request) {
  return handleAuthRequest(request);
}

async function handleAuthRequest(request) {
  let searchParams;

  if (request.method === 'POST') {
    const formData = await request.formData();
    searchParams = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      searchParams.append(key, value);
    }
  } else {
    searchParams = new URL(request.url).searchParams;
  }

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const nonce = searchParams.get('nonce');
  const ltiMessageHintBase64 = searchParams.get('lti_message_hint');

  let contextData = {
    type: 'LtiResourceLinkRequest',
    courseId: 'default-course',
    courseTitle: 'Default Course',
  };

  if (ltiMessageHintBase64) {
    try {
      contextData = JSON.parse(
        Buffer.from(ltiMessageHintBase64, 'base64').toString('utf-8'),
      );
    } catch (e) {
      console.error('Lỗi parse message_hint');
    }
  }

  const sessionUser = await getSessionUser(request);
  if (!sessionUser)
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  try {
    const privateKey = await getPrivateKey();
    const keyId = process.env.LTI_KEY_ID || 'key-1';
    const issuer = process.env.NEXT_PUBLIC_APP_URL;

    // 3. TẠO LTI 1.3 JWT PAYLOAD
    const jwtPayload = {
      iss: issuer,
      aud: clientId,
      sub: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      nonce: nonce,
      'https://purl.imsglobal.org/spec/lti/claim/message_type':
        contextData.type,
      'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
      'https://purl.imsglobal.org/spec/lti/claim/deployment_id': '1',
      'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': redirectUri,
      'https://purl.imsglobal.org/spec/lti/claim/roles': [
        sessionUser.role === 'admin'
          ? 'http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator'
          : 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
      ],
      // Gán đúng bối cảnh môn học
      'https://purl.imsglobal.org/spec/lti/claim/context': {
        id: contextData.courseId,
        title: contextData.courseTitle,
      },
      // CÁC CUSTOM PARAMETERS BẮT BUỘC CỦA MICROSOFT
      'https://purl.imsglobal.org/spec/lti/claim/custom': {
        t: 'Microsoft 365 Assignment',
        dd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Mock hạn nộp
        mp: '100', // Điểm tối đa
        csid: contextData.courseId,
        ssid: `${contextData.courseId}-section-1`,
      },
    };

    // 4. KIỂM TRA LOẠI KHỞI CHẠY (Deep Linking vs Resource)
    if (contextData.type === 'LtiResourceLinkRequest') {
      jwtPayload['https://purl.imsglobal.org/spec/lti/claim/resource_link'] = {
        id: `${contextData.courseId}-res-1`,
        title: 'Khởi chạy công cụ M365',
      };
    } else if (contextData.type === 'LtiDeepLinkingRequest') {
      jwtPayload[
        'https://purl.imsglobal.org/spec/lti/claim/deep_linking_settings'
      ] = {
        deep_link_return_url: `${issuer}/api/lti/deeplink`,
        accept_types: ['ltiResourceLink'],
        accept_presentation_document_targets: ['iframe', 'window'],
      };
    }

    // 5. KÝ TOKEN
    const idToken = await new jose.SignJWT(jwtPayload)
      .setProtectedHeader({ alg: 'RS256', kid: keyId })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    // 6. TRẢ VỀ FORM POST
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head><title>LTI Launching...</title></head>
        <body onload="document.getElementById('lti-form').submit();">
          <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
            <p>Đang xác thực bảo mật và chuyển hướng đến Microsoft 365...</p>
          </div>
          <form id="lti-form" action="${redirectUri}" method="POST">
            <input type="hidden" name="id_token" value="${idToken}" />
            <input type="hidden" name="state" value="${state}" />
          </form>
        </body>
      </html>
    `;

    return new NextResponse(htmlResponse, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Lỗi tạo OIDC JWT:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
