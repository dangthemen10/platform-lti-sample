// app/dashboard/page.jsx
// ============================================================
// Dashboard của Education Hub (Platform).
// User đăng nhập vào đây, rồi từ đây MỞ các Tool của Microsoft.
// Mỗi nút "Mở Tool" sẽ trigger /api/lti/launch để khởi động
// OIDC flow sang Microsoft LTI Gateway.
// ============================================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [loadingTool, setLoadingTool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchSession();
    fetchTools();
  }, []);

  async function fetchSession() {
    try {
      const res = await fetch('/api/auth/session');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchTools() {
    try {
      const res = await fetch('/api/lti/tools');
      const data = await res.json();
      setTools(data.tools || []);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Education Hub (Platform) chủ động khởi động LTI launch
   * để mở một Microsoft Tool cho user.
   * Redirect đến /api/lti/launch?toolId=xxx
   * → API redirect sang MS LTI Gateway
   * → Gateway xác thực
   * → Callback về /api/lti/callback
   * → Redirect user đến Tool URL thực
   */
  function handleOpenTool(toolId, toolName) {
    setLoadingTool(toolId);
    // Điều hướng trực tiếp — đây là redirect flow
    window.location.href = `/api/lti/launch?toolId=${toolId}`;
  }

  const toolIcons = {
    onedrive: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 14.5c0-2.2 1.6-4 3.7-4.4L9 6.2A6 6 0 0 1 20.5 10c1.4.3 2.5 1.5 2.5 3a3 3 0 0 1-3 3H5a3 3 0 0 1-1-.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    teams: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="6"
          width="18"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 6V5a2 2 0 0 1 4 0v1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 11h8M8 15h5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    sharepoint: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M3 9h18M9 9v12" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    other: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 8v4l3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">EH</span>
            </div>
            <span className="font-semibold text-gray-900">Education Hub</span>
            <span className="text-gray-300 text-sm ml-1">Platform</span>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{user.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${
                  user.role === 'instructor'
                    ? 'bg-purple-100 text-purple-700'
                    : user.role === 'admin'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                }`}>
                {user.role}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Xin chào, {user?.name || 'bạn'}
          </h1>
          <p className="text-gray-500 text-sm">
            Chọn công cụ Microsoft muốn mở từ Education Hub
          </p>
        </div>

        {/* Microsoft Tools Grid */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Công cụ Microsoft 365
          </h2>

          {tools.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400 text-sm">
                Chưa có tool nào được cấu hình.
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Chạy{' '}
                <code className="bg-gray-50 px-1 rounded">npm run seed</code> để
                thêm dữ liệu mẫu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <div
                  key={tool._id}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-blue-500 mt-0.5">
                      {toolIcons[tool.toolType] || toolIcons.other}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {tool.toolType}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenTool(tool._id, tool.name)}
                    disabled={loadingTool === tool._id}
                    className="
                      w-full flex items-center justify-center gap-2
                      bg-blue-600 hover:bg-blue-700
                      text-white text-sm font-medium
                      py-2.5 px-4 rounded-lg
                      transition-colors
                      disabled:opacity-60 disabled:cursor-not-allowed
                    ">
                    {loadingTool === tool._id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang mở...
                      </>
                    ) : (
                      <>Mở {tool.name}</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Flow explanation */}
        <section className="bg-blue-50 rounded-xl border border-blue-100 p-5">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            Luồng hoạt động khi bấm "Mở Tool"
          </h3>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>
              Education Hub (Platform) gọi{' '}
              <code className="bg-blue-100 px-1 rounded">/api/lti/launch</code>
            </li>
            <li>Tạo nonce + state, redirect đến Microsoft LTI Gateway</li>
            <li>Gateway xác thực Microsoft account của user</li>
            <li>
              Gateway POST id_token về{' '}
              <code className="bg-blue-100 px-1 rounded">
                /api/lti/callback
              </code>
            </li>
            <li>Education Hub verify JWT, redirect đến URL tool thực</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
