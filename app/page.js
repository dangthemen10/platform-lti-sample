// app/page.jsx
// ============================================================
// Trang Home — Màn hình chào mừng với nút trigger LTI Launch.
//
// Khi user nhấn "Mở tài liệu OneDrive (Test LTI)", trình duyệt
// sẽ redirect đến /api/lti/login với các params cần thiết.
// Server sẽ xử lý và redirect tiếp sang Microsoft.
// ============================================================
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Trigger LTI Launch bằng cách redirect đến login initiation endpoint.
   *
   * Trong môi trường thực tế, Microsoft LTI Gateway tự gọi endpoint này.
   * Ở đây chúng ta simulate bằng cách điền tay các params để TEST.
   */
  const handleLtiLaunch = () => {
    setIsLoading(true);

    // Lấy các giá trị từ biến môi trường public (NEXT_PUBLIC_*)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const clientId = process.env.NEXT_PUBLIC_LTI_CLIENT_ID;
    const issuer = process.env.NEXT_PUBLIC_LTI_ISSUER;

    if (!clientId || !issuer) {
      alert(
        '⚠️ Thiếu biến môi trường NEXT_PUBLIC_LTI_CLIENT_ID hoặc NEXT_PUBLIC_LTI_ISSUER.\n' +
          'Vui lòng cấu hình trong .env.local',
      );
      setIsLoading(false);
      return;
    }

    // Xây dựng URL với params mô phỏng request từ Microsoft LTI Gateway
    const loginUrl = new URL(`${appUrl}/api/lti/login`);
    loginUrl.searchParams.set('iss', issuer);
    loginUrl.searchParams.set('client_id', clientId);
    loginUrl.searchParams.set('login_hint', 'test-user-hint');
    loginUrl.searchParams.set('target_link_uri', `${appUrl}/dashboard`);
    loginUrl.searchParams.set('lti_message_hint', 'test-onedrive-resource');

    // Redirect (không dùng fetch vì đây là redirect flow)
    window.location.href = loginUrl.toString();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* ── HEADER ── */}
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EH</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">
              Education Hub
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <a
              href="/api/lti/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              JWKS Keys
            </a>
          </nav>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          LTI 1.3 Advantage · Microsoft 365
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Education Hub
          <br />
          <span className="text-blue-600">Sample Integration</span>
        </h1>

        <p className="text-xl text-gray-500 mb-4 max-w-2xl mx-auto leading-relaxed">
          Dự án demo tích hợp chuẩn <strong>LTI 1.3 Advantage</strong> với{' '}
          <strong>Microsoft 365 LTI Gateway</strong>. Sử dụng Next.js + MongoDB,
          deploy trên Vercel.
        </p>

        <p className="text-sm text-gray-400 mb-12">
          Nhấn nút bên dưới để bắt đầu OIDC flow và test kết nối với Microsoft
        </p>

        {/* ── NÚT TEST LTI LAUNCH ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleLtiLaunch}
            disabled={isLoading}
            className="
              group relative inline-flex items-center gap-3
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold
              px-8 py-4 rounded-xl
              shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50
              transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed
              text-base
            ">
            {/* Microsoft Logo (SVG đơn giản) */}
            {!isLoading ? (
              <svg width="20" height="20" viewBox="0 0 23 23" fill="none">
                <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
              </svg>
            ) : (
              <svg
                className="animate-spin"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {isLoading
              ? 'Đang chuyển hướng...'
              : 'Mở tài liệu OneDrive (Test LTI)'}
          </button>

          <Link
            href="/dashboard"
            className="
              inline-flex items-center gap-2
              border border-gray-200 hover:border-blue-300
              text-gray-600 hover:text-blue-600
              font-medium px-6 py-4 rounded-xl
              transition-all duration-200
              text-base
            ">
            Xem Dashboard trực tiếp →
          </Link>
        </div>
      </section>

      {/* ── FLOW DIAGRAM ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">
          LTI 1.3 OIDC Flow
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
          {[
            { step: '1', label: 'User nhấn nút trong LMS', icon: '👤' },
            { step: '→', label: '', icon: null },
            {
              step: '2',
              label: '/api/lti/login\nTạo nonce + state',
              icon: '🔑',
            },
            { step: '→', label: '', icon: null },
            { step: '3', label: 'Microsoft Login\n(OIDC Auth)', icon: '🏢' },
          ].map((item, i) =>
            item.icon ? (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-xs font-bold text-blue-600 mb-1">
                  Bước {item.step}
                </div>
                <div className="text-xs text-gray-500 whitespace-pre-line">
                  {item.label}
                </div>
              </div>
            ) : (
              <div
                key={i}
                className="text-center text-gray-300 text-xl hidden sm:block">
                →
              </div>
            ),
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center mt-2">
          {[
            {
              step: '4',
              label: 'POST id_token về\n/api/lti/launch',
              icon: '📨',
            },
            { step: '→', label: '', icon: null },
            { step: '5', label: 'Verify JWT\nUpsert User', icon: '✅' },
            { step: '→', label: '', icon: null },
            { step: '6', label: 'Dashboard\n(Session Cookie)', icon: '🎓' },
          ].map((item, i) =>
            item.icon ? (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-xs font-bold text-blue-600 mb-1">
                  Bước {item.step}
                </div>
                <div className="text-xs text-gray-500 whitespace-pre-line">
                  {item.label}
                </div>
              </div>
            ) : (
              <div
                key={i}
                className="text-center text-gray-300 text-xl hidden sm:block">
                →
              </div>
            ),
          )}
        </div>
      </section>

      {/* ── ENDPOINTS ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">
          API Endpoints
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {[
            {
              method: 'GET/POST',
              path: '/api/lti/login',
              desc: 'OIDC Login Initiation — nhận từ LMS, redirect sang Microsoft',
              color: 'bg-green-50 text-green-700',
            },
            {
              method: 'POST',
              path: '/api/lti/launch',
              desc: 'LTI Launch — nhận id_token từ Microsoft, verify và tạo session',
              color: 'bg-blue-50 text-blue-700',
            },
            {
              method: 'GET',
              path: '/api/lti/keys',
              desc: 'JWKS — cung cấp Public Key RSA của Education Hub',
              color: 'bg-purple-50 text-purple-700',
            },
            {
              method: 'GET',
              path: '/api/auth/session',
              desc: 'Lấy thông tin user hiện tại từ session cookie',
              color: 'bg-yellow-50 text-yellow-700',
            },
          ].map((ep, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
              <span
                className={`text-xs font-bold px-2 py-1 rounded font-mono shrink-0 ${ep.color}`}>
                {ep.method}
              </span>
              <span className="font-mono text-sm text-gray-700 shrink-0 w-48">
                {ep.path}
              </span>
              <span className="text-sm text-gray-400">{ep.desc}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
