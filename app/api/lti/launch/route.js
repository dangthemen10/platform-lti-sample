// app/api/lti/launch/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LtiRegistration from '@/models/LtiRegistration';
import { getSessionUser } from '@/lib/session';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const toolId = searchParams.get('toolId');
  const courseId = searchParams.get('courseId') || 'course-101';
  const launchType = searchParams.get('launchType') || 'resource'; // 'resource' hoặc 'deeplink'

  const sessionUser = await getSessionUser(request);
  if (!sessionUser)
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  await connectToDatabase();
  const registration = await LtiRegistration.findById(toolId).lean();

  // URL khởi tạo đăng nhập của Microsoft (OIDC Login Initiation URL)
  const initiationUrl = new URL(registration.authorizationEndpoint);

  const contextData = {
    type:
      launchType === 'deeplink'
        ? 'LtiDeepLinkingRequest'
        : 'LtiResourceLinkRequest',
    courseId: courseId,
    courseTitle: 'Lớp Khoa học Máy tính',
  };
  const ltiMessageHint = Buffer.from(JSON.stringify(contextData)).toString(
    'base64',
  );

  // Các tham số LMS gửi sang Tool để Tool biết ai đang gọi
  initiationUrl.searchParams.set('iss', process.env.NEXT_PUBLIC_APP_URL);
  initiationUrl.searchParams.set('client_id', registration.clientId);
  initiationUrl.searchParams.set('target_link_uri', registration.targetLinkUri);
  initiationUrl.searchParams.set('login_hint', sessionUser.id);
  initiationUrl.searchParams.set('lti_message_hint', ltiMessageHint);

  if (registration.deploymentId) {
    initiationUrl.searchParams.set(
      'lti_deployment_id',
      registration.deploymentId,
    );
  }

  // Redirect sang Microsoft Gateway
  return NextResponse.redirect(initiationUrl.toString());
}
