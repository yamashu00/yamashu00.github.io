import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db as firestore } from './firebase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // ドメイン制限チェック
      const email = user.email || '';
      const allowedDomains = (process.env.ALLOWED_DOMAINS || '').split(',');
      const domain = email.split('@')[1];

      if (!allowedDomains.includes(domain)) {
        console.error('不正なドメインからのログイン試行:', email);
        return false; // ログイン拒否
      }

      // ロール自動割り当て
      let role = 'student'; // デフォルト

      // 教員リスト（管理者権限）
      const teachers = (process.env.TEACHER_EMAILS || '').split(',');

      // TAリスト
      const tas: string[] = [
        // 必要に応じてTAのメールアドレスを追加
      ];

      // 外部講師リスト
      const externalInstructors: string[] = [
        // 必要に応じて外部講師のメールアドレスを追加
      ];

      if (teachers.includes(email)) {
        role = 'teacher';
      } else if (tas.includes(email)) {
        role = 'ta';
      } else if (externalInstructors.includes(email)) {
        role = 'external-instructor';
      } else if (domain === 'seig-boys.jp') {
        // @seig-boys.jp の場合、デフォルトは生徒
        role = 'student';
      } else if (domain === 'itoksk.com') {
        // @itoksk.com の場合、デフォルトはTA
        role = 'ta';
      }

      // Firestoreにユーザー情報を保存・更新
      try {
        const userRef = firestore.collection('users').doc(email);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          // 新規ユーザー
          await userRef.set({
            email,
            role,
            displayName: user.name || '',
            avatar: user.image || '',
            createdAt: new Date(),
            lastLogin: new Date(),
            active: true,
            preferences: {
              emailNotifications: false,
              theme: 'light',
              language: 'ja',
            },
            stats: {
              totalConsultations: 0,
              resolvedCount: 0,
            },
          });
          console.log('新規ユーザー作成:', email, role);
        } else {
          // 既存ユーザー: lastLoginとロールを更新
          const existingData = userDoc.data();
          const updates: any = {
            lastLogin: new Date(),
          };

          // ロールが変更されている場合は更新
          if (existingData?.role !== role) {
            updates.role = role;
            console.log('ロール更新:', email, existingData?.role, '->', role);
          }

          await userRef.update(updates);
        }
      } catch (error) {
        console.error('Firestoreへのユーザー保存エラー:', error);
        return false;
      }

      return true;
    },

    async session({ session, token }) {
      // セッションにロール情報を追加
      if (session.user) {
        try {
          const userDoc = await firestore
            .collection('users')
            .doc(session.user.email!)
            .get();
          const userData = userDoc.data();

          (session.user as any).role = userData?.role || 'student';
          (session.user as any).displayName =
            userData?.displayName || session.user.name || '';
        } catch (error) {
          console.error('セッション取得エラー:', error);
        }
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // ログイン後のリダイレクト先
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
