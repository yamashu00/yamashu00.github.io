import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      email: string;
      name?: string | null;
      image?: string | null;
      role: 'student' | 'teacher' | 'ta' | 'external-instructor';
      displayName: string;
    };
  }

  interface User {
    email: string;
    name?: string | null;
    image?: string | null;
    role?: 'student' | 'teacher' | 'ta' | 'external-instructor';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'student' | 'teacher' | 'ta' | 'external-instructor';
  }
}
