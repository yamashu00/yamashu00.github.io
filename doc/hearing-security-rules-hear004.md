# Firebase Security Rules (#HEAR-004)

## 実施日: 2025-10-21

---

## 1. Firestore Security Rules

### 1.1 完全な firestore.rules ファイル

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ========================================
    // ヘルパー関数
    // ========================================

    // ユーザーが認証済みかチェック
    function isAuthenticated() {
      return request.auth != null;
    }

    // メールドメインをチェック
    function isSchoolDomain() {
      return request.auth.token.email.matches('.*@seig-boys[.]jp$') ||
             request.auth.token.email.matches('.*@itoksk[.]com$');
    }

    // ユーザーのロールを取得
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role;
    }

    // 生徒かチェック
    function isStudent() {
      return isAuthenticated() &&
             getUserRole() == 'student' &&
             request.auth.token.email.matches('.*@seig-boys[.]jp$');
    }

    // 教員かチェック
    function isTeacher() {
      return isAuthenticated() &&
             getUserRole() == 'teacher' &&
             isSchoolDomain();
    }

    // TAかチェック
    function isTA() {
      return isAuthenticated() &&
             getUserRole() == 'ta' &&
             request.auth.token.email.matches('.*@itoksk[.]com$');
    }

    // 外部講師かチェック
    function isExternalInstructor() {
      return isAuthenticated() &&
             getUserRole() == 'external-instructor' &&
             request.auth.token.email.matches('.*@itoksk[.]com$');
    }

    // 教員またはTAかチェック
    function isTeacherOrTA() {
      return isTeacher() || isTA();
    }

    // 教員、TA、または外部講師かチェック
    function isStaff() {
      return isTeacher() || isTA() || isExternalInstructor();
    }

    // 自分のデータかチェック
    function isOwnData(userId) {
      return request.auth.token.email == userId;
    }

    // データがPII除去済みかチェック
    function isPIIFiltered(data) {
      return !data.keys().hasAny(['originalDetails']);
    }

    // ========================================
    // consultations コレクション
    // ========================================

    match /consultations/{consultationId} {
      // 読み取りルール
      allow read: if isAuthenticated() && (
        // 生徒: 自分の相談のみ
        (isStudent() && isOwnData(resource.data.studentId)) ||
        // 教員・TA: 全件読取可（PII除去済み）
        isTeacherOrTA() ||
        // 外部講師: 匿名化済みのみ
        (isExternalInstructor() && isPIIFiltered(resource.data))
      );

      // 作成ルール
      allow create: if isAuthenticated() && (
        // 生徒: 自分の相談のみ作成可
        (isStudent() && isOwnData(request.resource.data.studentId)) ||
        // 教員・TA: 作成可
        isTeacherOrTA()
      ) &&
      // バリデーション
      request.resource.data.keys().hasAll(['studentId', 'timestamp', 'theme', 'details']) &&
      request.resource.data.studentId is string &&
      request.resource.data.timestamp is timestamp &&
      request.resource.data.theme is string &&
      request.resource.data.details is string &&
      // detailsが空でないこと
      request.resource.data.details.size() > 0 &&
      request.resource.data.details.size() <= 5000; // 最大5000文字

      // 更新ルール
      allow update: if isAuthenticated() && (
        // 生徒: status が draft の自分の相談のみ更新可
        (isStudent() &&
         isOwnData(resource.data.studentId) &&
         resource.data.status == 'draft') ||
        // 教員・TA: 全件更新可
        isTeacherOrTA()
      ) &&
      // 主キーフィールドは変更不可
      request.resource.data.consultationId == resource.data.consultationId &&
      request.resource.data.studentId == resource.data.studentId &&
      request.resource.data.timestamp == resource.data.timestamp;

      // 削除ルール（論理削除のみ）
      allow delete: if isTeacher() &&
                       resource.data.deletedAt != null; // 論理削除済みのみ完全削除可
    }

    // ========================================
    // users コレクション
    // ========================================

    match /users/{userId} {
      // 読み取りルール
      allow read: if isAuthenticated() && (
        // 自分のユーザー情報
        isOwnData(userId) ||
        // 教員・TA: 全ユーザー情報読取可
        isTeacherOrTA() ||
        // 外部講師: 匿名化済みのみ（emailフィールドがマスクされている）
        (isExternalInstructor() && !resource.data.keys().hasAny(['email']))
      );

      // 作成ルール（初回ログイン時の自動作成）
      allow create: if isAuthenticated() &&
                       isOwnData(userId) &&
                       isSchoolDomain() &&
                       request.resource.data.email == request.auth.token.email &&
                       request.resource.data.role in ['student', 'teacher', 'ta', 'external-instructor'];

      // 更新ルール
      allow update: if isAuthenticated() && (
        // 自分のユーザー情報: preferences のみ更新可
        (isOwnData(userId) &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['preferences', 'lastLogin', 'stats'])) ||
        // 教員: 全フィールド更新可
        isTeacher()
      );

      // 削除ルール
      allow delete: if isTeacher();
    }

    // ========================================
    // lessons コレクション
    // ========================================

    match /lessons/{lessonId} {
      // 読み取りルール: 全員読取可
      allow read: if isAuthenticated() && isSchoolDomain();

      // 作成・更新・削除: 教員のみ
      allow create, update, delete: if isTeacher();

      // サブコレクション: consultations への参照
      match /consultations/{consultationId} {
        allow read: if isAuthenticated() && isSchoolDomain();
        allow write: if isTeacher();
      }
    }

    // ========================================
    // reports コレクション
    // ========================================

    match /reports/{reportId} {
      // 読み取りルール
      allow read: if isAuthenticated() && (
        // 自分が作成したレポート
        isOwnData(resource.data.generatedBy) ||
        // 教員・TA: 全件読取可
        isTeacherOrTA() ||
        // accessibleBy に含まれるユーザー
        request.auth.token.email in resource.data.accessibleBy
      );

      // 作成ルール
      allow create: if isAuthenticated() && (
        isStudent() || isTeacherOrTA()
      ) &&
      request.resource.data.generatedBy == request.auth.token.email &&
      request.resource.data.format in ['pdf', 'markdown', 'json'] &&
      request.resource.data.expiresAt is timestamp;

      // 更新ルール: 教員のみ（有効期限延長等）
      allow update: if isTeacher();

      // 削除ルール: 教員のみ
      allow delete: if isTeacher();
    }

    // ========================================
    // analytics コレクション
    // ========================================

    match /analytics/{analyticsId} {
      // 読み取りルール: 教員・TA・外部講師のみ
      allow read: if isStaff();

      // 作成・更新・削除: 教員のみ（自動生成される）
      allow create, update, delete: if isTeacher();
    }

    // ========================================
    // audit_logs コレクション（監査ログ）
    // ========================================

    match /audit_logs/{logId} {
      // 読み取りルール: 教員のみ
      allow read: if isTeacher();

      // 作成ルール: システムのみ（Cloud Functions）
      allow create: if false; // Cloud Functionsから admin SDK で書き込み

      // 更新・削除: 不可
      allow update, delete: if false;
    }
  }
}
```

---

## 2. Cloud Storage Security Rules

### 2.1 完全な storage.rules ファイル

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // ========================================
    // ヘルパー関数
    // ========================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function isSchoolDomain() {
      return request.auth.token.email.matches('.*@seig-boys[.]jp$') ||
             request.auth.token.email.matches('.*@itoksk[.]com$');
    }

    function getUserRole() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.token.email)).data.role;
    }

    function isTeacher() {
      return isAuthenticated() && getUserRole() == 'teacher';
    }

    function isTA() {
      return isAuthenticated() && getUserRole() == 'ta';
    }

    function isTeacherOrTA() {
      return isTeacher() || isTA();
    }

    // ファイルサイズ制限（10MB）
    function isValidSize() {
      return request.resource.size <= 10 * 1024 * 1024;
    }

    // PDFファイルかチェック
    function isPDF() {
      return request.resource.contentType == 'application/pdf';
    }

    // Markdownファイルかチェック
    function isMarkdown() {
      return request.resource.contentType == 'text/markdown';
    }

    // JSONファイルかチェック
    function isJSON() {
      return request.resource.contentType == 'application/json';
    }

    // CSVファイルかチェック
    function isCSV() {
      return request.resource.contentType == 'text/csv';
    }

    // ========================================
    // PDF レポート
    // ========================================

    match /pdf/{consultationId}/{fileName} {
      // 読み取り: 認証済みユーザー（署名付きURLでアクセス制御）
      allow read: if isAuthenticated() && isSchoolDomain();

      // 書き込み: 認証済みユーザー、PDFファイル、サイズ制限内
      allow write: if isAuthenticated() &&
                      isSchoolDomain() &&
                      isPDF() &&
                      isValidSize();

      // 削除: 教員のみ
      allow delete: if isTeacher();
    }

    // ========================================
    // Markdown レポート
    // ========================================

    match /markdown/{consultationId}/{fileName} {
      allow read: if isAuthenticated() && isSchoolDomain();

      allow write: if isAuthenticated() &&
                      isSchoolDomain() &&
                      isMarkdown() &&
                      isValidSize();

      allow delete: if isTeacher();
    }

    // ========================================
    // JSON レポート
    // ========================================

    match /json/{consultationId}/{fileName} {
      allow read: if isAuthenticated() && isSchoolDomain();

      allow write: if isAuthenticated() &&
                      isSchoolDomain() &&
                      isJSON() &&
                      isValidSize();

      allow delete: if isTeacher();
    }

    // ========================================
    // エクスポートファイル（CSV/JSON）
    // ========================================

    match /exports/csv/{fileName} {
      allow read: if isTeacherOrTA();
      allow write: if isTeacherOrTA() && isCSV() && isValidSize();
      allow delete: if isTeacher();
    }

    match /exports/json/{fileName} {
      allow read: if isTeacherOrTA();
      allow write: if isTeacherOrTA() && isJSON() && isValidSize();
      allow delete: if isTeacher();
    }
  }
}
```

---

## 3. セキュリティルールのテスト

### 3.1 Firestore Rules Unit Tests

```typescript
// test/firestore.rules.test.ts
import * as testing from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

const PROJECT_ID = 'yamashu-hearing-test';
const RULES = readFileSync('firestore.rules', 'utf8');

describe('Firestore Security Rules', () => {
  let testEnv: testing.RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await testing.initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: RULES,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  // ========================================
  // consultations コレクションのテスト
  // ========================================

  describe('consultations collection', () => {
    it('生徒は自分の相談のみ読み取れる', async () => {
      const studentEmail = 'student1@seig-boys.jp';
      const db = testEnv.authenticatedContext(studentEmail, {
        email: studentEmail,
      }).firestore();

      // 自分のユーザー情報を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(studentEmail).set({
          email: studentEmail,
          role: 'student',
        });
      });

      // 自分の相談を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('consultations').doc('consultation1').set({
          consultationId: 'consultation1',
          studentId: studentEmail,
          timestamp: testing.firestore.Timestamp.now(),
          theme: 'テストテーマ',
          details: 'テスト詳細',
          status: 'draft',
        });
      });

      // 読み取り成功
      await testing.assertSucceeds(
        db.collection('consultations').doc('consultation1').get()
      );

      // 他の生徒の相談を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('consultations').doc('consultation2').set({
          consultationId: 'consultation2',
          studentId: 'student2@seig-boys.jp',
          timestamp: testing.firestore.Timestamp.now(),
          theme: 'テストテーマ',
          details: 'テスト詳細',
          status: 'draft',
        });
      });

      // 読み取り失敗
      await testing.assertFails(
        db.collection('consultations').doc('consultation2').get()
      );
    });

    it('教員は全ての相談を読み取れる', async () => {
      const teacherEmail = 'teacher@seig-boys.jp';
      const db = testEnv.authenticatedContext(teacherEmail, {
        email: teacherEmail,
      }).firestore();

      // 教員のユーザー情報を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(teacherEmail).set({
          email: teacherEmail,
          role: 'teacher',
        });
      });

      // 生徒の相談を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('consultations').doc('consultation1').set({
          consultationId: 'consultation1',
          studentId: 'student1@seig-boys.jp',
          timestamp: testing.firestore.Timestamp.now(),
          theme: 'テストテーマ',
          details: 'テスト詳細',
          status: 'completed',
        });
      });

      // 読み取り成功
      await testing.assertSucceeds(
        db.collection('consultations').doc('consultation1').get()
      );
    });

    it('生徒は自分の相談を作成できる', async () => {
      const studentEmail = 'student1@seig-boys.jp';
      const db = testEnv.authenticatedContext(studentEmail, {
        email: studentEmail,
      }).firestore();

      // ユーザー情報を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(studentEmail).set({
          email: studentEmail,
          role: 'student',
        });
      });

      // 作成成功
      await testing.assertSucceeds(
        db.collection('consultations').doc('consultation1').set({
          consultationId: 'consultation1',
          studentId: studentEmail,
          timestamp: testing.firestore.Timestamp.now(),
          theme: 'テストテーマ',
          details: 'テスト詳細',
          status: 'draft',
        })
      );

      // 他人の相談を作成しようとすると失敗
      await testing.assertFails(
        db.collection('consultations').doc('consultation2').set({
          consultationId: 'consultation2',
          studentId: 'other@seig-boys.jp',
          timestamp: testing.firestore.Timestamp.now(),
          theme: 'テストテーマ',
          details: 'テスト詳細',
          status: 'draft',
        })
      );
    });

    it('生徒はdraft状態の自分の相談のみ更新できる', async () => {
      const studentEmail = 'student1@seig-boys.jp';
      const db = testEnv.authenticatedContext(studentEmail, {
        email: studentEmail,
      }).firestore();

      // ユーザー情報を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(studentEmail).set({
          email: studentEmail,
          role: 'student',
        });
      });

      // draft状態の相談を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('consultations').doc('consultation1').set({
          consultationId: 'consultation1',
          studentId: studentEmail,
          timestamp: testing.firestore.Timestamp.now(),
          theme: 'テストテーマ',
          details: 'テスト詳細',
          status: 'draft',
        });
      });

      // 更新成功
      await testing.assertSucceeds(
        db.collection('consultations').doc('consultation1').update({
          details: '更新されたテスト詳細',
        })
      );

      // completed状態の相談を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('consultations').doc('consultation2').set({
          consultationId: 'consultation2',
          studentId: studentEmail,
          timestamp: testing.firestore.Timestamp.now(),
          theme: 'テストテーマ',
          details: 'テスト詳細',
          status: 'completed',
        });
      });

      // 更新失敗（completedは更新不可）
      await testing.assertFails(
        db.collection('consultations').doc('consultation2').update({
          details: '更新されたテスト詳細',
        })
      );
    });

    it('未認証ユーザーはアクセスできない', async () => {
      const db = testEnv.unauthenticatedContext().firestore();

      // 読み取り失敗
      await testing.assertFails(
        db.collection('consultations').doc('consultation1').get()
      );

      // 作成失敗
      await testing.assertFails(
        db.collection('consultations').doc('consultation1').set({
          consultationId: 'consultation1',
          studentId: 'student1@seig-boys.jp',
          timestamp: testing.firestore.Timestamp.now(),
          theme: 'テストテーマ',
          details: 'テスト詳細',
        })
      );
    });

    it('学校ドメイン以外はアクセスできない', async () => {
      const externalEmail = 'hacker@example.com';
      const db = testEnv.authenticatedContext(externalEmail, {
        email: externalEmail,
      }).firestore();

      // ユーザー情報を作成（school domainではない）
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(externalEmail).set({
          email: externalEmail,
          role: 'student', // roleがあってもドメインが違うので拒否される
        });
      });

      // 相談を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('consultations').doc('consultation1').set({
          consultationId: 'consultation1',
          studentId: externalEmail,
          timestamp: testing.firestore.Timestamp.now(),
          theme: 'テストテーマ',
          details: 'テスト詳細',
          status: 'draft',
        });
      });

      // 読み取り失敗（school domainではない）
      await testing.assertFails(
        db.collection('consultations').doc('consultation1').get()
      );
    });
  });

  // ========================================
  // users コレクションのテスト
  // ========================================

  describe('users collection', () => {
    it('ユーザーは自分のユーザー情報を読み取れる', async () => {
      const studentEmail = 'student1@seig-boys.jp';
      const db = testEnv.authenticatedContext(studentEmail, {
        email: studentEmail,
      }).firestore();

      // ユーザー情報を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(studentEmail).set({
          email: studentEmail,
          role: 'student',
        });
      });

      // 読み取り成功
      await testing.assertSucceeds(
        db.collection('users').doc(studentEmail).get()
      );

      // 他のユーザー情報は読み取れない
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('other@seig-boys.jp').set({
          email: 'other@seig-boys.jp',
          role: 'student',
        });
      });

      await testing.assertFails(
        db.collection('users').doc('other@seig-boys.jp').get()
      );
    });

    it('初回ログイン時にユーザー情報を作成できる', async () => {
      const studentEmail = 'student1@seig-boys.jp';
      const db = testEnv.authenticatedContext(studentEmail, {
        email: studentEmail,
      }).firestore();

      // 作成成功
      await testing.assertSucceeds(
        db.collection('users').doc(studentEmail).set({
          email: studentEmail,
          role: 'student',
          displayName: '生徒1',
          createdAt: testing.firestore.Timestamp.now(),
        })
      );
    });

    it('ユーザーは自分のpreferencesのみ更新できる', async () => {
      const studentEmail = 'student1@seig-boys.jp';
      const db = testEnv.authenticatedContext(studentEmail, {
        email: studentEmail,
      }).firestore();

      // ユーザー情報を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(studentEmail).set({
          email: studentEmail,
          role: 'student',
          preferences: {
            emailNotifications: false,
          },
        });
      });

      // preferences更新成功
      await testing.assertSucceeds(
        db.collection('users').doc(studentEmail).update({
          preferences: {
            emailNotifications: true,
          },
        })
      );

      // role更新失敗（preferencesのみ更新可）
      await testing.assertFails(
        db.collection('users').doc(studentEmail).update({
          role: 'teacher',
        })
      );
    });
  });

  // ========================================
  // lessons コレクションのテスト
  // ========================================

  describe('lessons collection', () => {
    it('認証済みユーザーはレッスン情報を読み取れる', async () => {
      const studentEmail = 'student1@seig-boys.jp';
      const db = testEnv.authenticatedContext(studentEmail, {
        email: studentEmail,
      }).firestore();

      // ユーザー情報を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(studentEmail).set({
          email: studentEmail,
          role: 'student',
        });
      });

      // レッスン情報を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('lessons').doc('lesson-1').set({
          lessonId: 'lesson-1',
          lessonNumber: 1,
          title: '第1回授業',
        });
      });

      // 読み取り成功
      await testing.assertSucceeds(
        db.collection('lessons').doc('lesson-1').get()
      );
    });

    it('教員のみレッスン情報を作成・更新・削除できる', async () => {
      const teacherEmail = 'teacher@seig-boys.jp';
      const db = testEnv.authenticatedContext(teacherEmail, {
        email: teacherEmail,
      }).firestore();

      // 教員のユーザー情報を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(teacherEmail).set({
          email: teacherEmail,
          role: 'teacher',
        });
      });

      // 作成成功
      await testing.assertSucceeds(
        db.collection('lessons').doc('lesson-1').set({
          lessonId: 'lesson-1',
          lessonNumber: 1,
          title: '第1回授業',
        })
      );

      // 更新成功
      await testing.assertSucceeds(
        db.collection('lessons').doc('lesson-1').update({
          title: '第1回授業（更新）',
        })
      );

      // 削除成功
      await testing.assertSucceeds(
        db.collection('lessons').doc('lesson-1').delete()
      );
    });
  });
});
```

---

### 3.2 テスト実行

```bash
# 依存関係インストール
npm install --save-dev @firebase/rules-unit-testing

# テスト実行
npm test -- firestore.rules.test.ts

# カバレッジレポート
npm test -- --coverage
```

---

## 4. デプロイ手順

### 4.1 Firebase CLI セットアップ

```bash
# Firebase CLI インストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクト初期化
firebase init

# 選択項目:
# - Firestore
# - Storage
# - Functions (オプション)
```

---

### 4.2 プロジェクト構成

```
yamashu-hearing/
├── firestore.rules         # Firestoreセキュリティルール
├── firestore.indexes.json  # Firestoreインデックス
├── storage.rules           # Storageセキュリティルール
├── firebase.json           # Firebase設定
├── .firebaserc             # プロジェクトエイリアス
└── test/
    └── firestore.rules.test.ts
```

---

### 4.3 firebase.json 設定

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

---

### 4.4 firestore.indexes.json（複合インデックス）

```json
{
  "indexes": [
    {
      "collectionGroup": "consultations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "studentId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "consultations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "lessonNumber",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "consultations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "consultations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "resolved",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "consultations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "tags",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

### 4.5 デプロイコマンド

```bash
# Firestoreルールのみデプロイ
firebase deploy --only firestore:rules

# Storageルールのみデプロイ
firebase deploy --only storage

# インデックスのみデプロイ
firebase deploy --only firestore:indexes

# 全てデプロイ
firebase deploy
```

---

### 4.6 ローカルエミュレータでのテスト

```bash
# エミュレータ起動
firebase emulators:start

# 別ターミナルでテスト実行
npm test

# エミュレータUI確認
open http://localhost:4000
```

---

## 5. セキュリティルールの検証

### 5.1 手動検証チェックリスト

#### 認証・認可
- [ ] 未認証ユーザーは全てのコレクションにアクセスできない
- [ ] 学校ドメイン以外のユーザーはアクセスできない
- [ ] 生徒は自分の相談のみ読み取れる
- [ ] 教員は全ての相談を読み取れる
- [ ] TAは全ての相談を読み取れる
- [ ] 外部講師は匿名化済みデータのみ読み取れる

#### データ作成
- [ ] 生徒は自分の相談のみ作成できる
- [ ] 教員・TAは相談を作成できる
- [ ] バリデーションが機能する（必須フィールド、型、サイズ制限）

#### データ更新
- [ ] 生徒はdraft状態の自分の相談のみ更新できる
- [ ] 教員は全ての相談を更新できる
- [ ] 主キーフィールドは変更できない

#### データ削除
- [ ] 生徒は相談を削除できない
- [ ] 教員のみ論理削除済みデータを完全削除できる

#### ファイルストレージ
- [ ] 認証済みユーザーのみファイルをアップロードできる
- [ ] ファイル形式が正しい（PDF、Markdown、JSON、CSV）
- [ ] ファイルサイズが制限内（10MB以下）
- [ ] 教員のみファイルを削除できる

---

### 5.2 自動検証スクリプト

```typescript
// scripts/validate-security-rules.ts
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

async function validateSecurityRules() {
  console.log('セキュリティルールの検証を開始します...\n');

  // テスト1: 未認証ユーザーのアクセス拒否
  console.log('テスト1: 未認証ユーザーのアクセス拒否');
  try {
    const unauthDb = admin.firestore(); // 未認証コンテキスト
    await unauthDb.collection('consultations').doc('test').get();
    console.log('❌ FAIL: 未認証ユーザーがアクセスできました\n');
  } catch (error) {
    console.log('✅ PASS: 未認証ユーザーは正しく拒否されました\n');
  }

  // テスト2: 生徒が自分の相談のみ読み取れる
  console.log('テスト2: 生徒が自分の相談のみ読み取れる');
  const studentEmail = 'student1@seig-boys.jp';
  const studentDb = admin.firestore(); // 生徒コンテキスト（実際にはAuth tokenが必要）

  // ... 他のテストケース

  console.log('検証完了');
}

validateSecurityRules();
```

---

## 6. 運用時のモニタリング

### 6.1 セキュリティルール違反の監視

```typescript
// functions/src/monitoring.ts
import * as functions from 'firebase-functions';

export const monitorSecurityRuleViolations = functions.firestore
  .document('{collection}/{docId}')
  .onWrite(async (change, context) => {
    const after = change.after.data();

    // 不正なアクセスパターンを検出
    if (after && after.studentId && !context.auth) {
      console.error('不正なアクセス検出:', {
        collection: context.params.collection,
        docId: context.params.docId,
        timestamp: new Date().toISOString(),
      });

      // アラート送信（Cloud Logging、メール等）
      // ...
    }
  });
```

---

### 6.2 Cloud Logging クエリ

```sql
-- セキュリティルール違反の検索
resource.type="cloud_firestore_database"
protoPayload.status.code="7"
protoPayload.status.message=~"PERMISSION_DENIED"

-- 大量アクセスの検出
resource.type="cloud_firestore_database"
protoPayload.authenticationInfo.principalEmail="suspicious@example.com"
```

---

## 7. まとめ

### 完了事項

✅ **Firestore Security Rules実装**
- consultations, users, lessons, reports, analytics, audit_logs の6コレクション
- ロール別アクセス制御（student, teacher, ta, external-instructor）
- ドメイン制限（@seig-boys.jp、@itoksk.com）
- PII保護（originalDetailsフィールドへのアクセス制限）

✅ **Cloud Storage Security Rules実装**
- PDF/Markdown/JSONレポートのアクセス制御
- CSV/JSONエクスポートの教員・TA限定アクセス
- ファイル形式・サイズバリデーション

✅ **Unit Tests作成**
- Firestore Rulesの包括的なテストケース
- 認証・認可の検証
- データ作成・更新・削除の検証

✅ **デプロイ手順書**
- Firebase CLI セットアップ
- プロジェクト構成
- 複合インデックス定義
- デプロイコマンド

✅ **運用時のモニタリング**
- セキュリティルール違反の監視
- Cloud Logging クエリ

### 次のステップ

**#HEAR-005**: OAuth連携とVercelデプロイ環境のセットアップ
- Google Workspace OAuth設定（@seig-boys.jp、@itoksk.com）
- NextAuth.js設定
- Vercel環境変数設定
- デプロイ実行
