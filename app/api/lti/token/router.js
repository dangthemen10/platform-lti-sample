// app/api/lti/token/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Thực tế, bạn sẽ kiểm tra JWT "Client Assertion" do Microsoft gửi lên ở đây.
  // Tuy nhiên, để vượt qua bước setup và chạy thử, ta mock một Access Token hợp lệ.

  return NextResponse.json({
    access_token: 'mock_lms_access_token_abc123',
    token_type: 'Bearer',
    expires_in: 3600, // 1 tiếng
    scope: 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
  });
}
