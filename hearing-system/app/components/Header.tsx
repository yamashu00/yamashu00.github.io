'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  userName?: string;
  userRole?: string;
  showLogout?: boolean;
  links?: Array<{
    href: string;
    label: string;
    position?: 'left' | 'right';
  }>;
}

export default function Header({
  title,
  userName,
  userRole,
  showLogout = true,
  links = []
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut({ redirect: false });
      router.push('/auth/signin');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student': return '生徒';
      case 'teacher': return '教員';
      case 'ta': return 'TA';
      case 'external-instructor': return '外部講師';
      default: return role;
    }
  };

  const leftLinks = links.filter(l => l.position === 'left' || !l.position);
  const rightLinks = links.filter(l => l.position === 'right');

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {leftLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => router.push(link.href)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {rightLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => router.push(link.href)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {link.label}
              </button>
            ))}

            {userName && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{userName}</span>
                {userRole && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {getRoleLabel(userRole)}
                  </span>
                )}
              </div>
            )}

            {showLogout && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-medium"
              >
                ログアウト
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
