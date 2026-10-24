# ⛪ 교회 소년부 스마트 출석부 (PWA 웹앱)

> **Vue 3 + Vite + Tailwind CSS + Pinia + Firebase / PWA**  
> 모바일(Android / iOS) 및 PC에서 앱처럼 설치하여 사용하는 연도별 교회 소년부 출석 및 달란트 관리 시스템입니다.

---

## ✨ 핵심 기능 요약

### 1. 역할 및 권한 체계
- **관리자 (목사님, 서기)**
  - **출석 통계 대시보드**: 주차별 1부/2부 및 목장별 출석 인원, 전체 출석 인원, 출석률 프로그레스바 집계
  - **목장(반) 관리**: 1부 14개 목장, 2부 7개 목장 기본 탑재 및 신규 목장 추가, 이름/순서 수정, 삭제
  - **선생님 관리**: 각 반 선생님 계정 생성/관리 및 목장 배정
  - **체크 항목 & 달란트 설정**: 성경읽기, 대표기도 등 체크박스 컬럼 동적 추가/삭제, 각 항목별 지급할 달란트 점수 설정 (예: 출석 2점, 성경읽기 3점, 대표기도 5점 등)
  - **월별 달란트 합계 및 랭킹**: 매달 학생별/목장별 달란트 자동 집계, 1위 달란트 왕 및 **엑셀(XLSX) 다운로드** 지원
  - **마감 잠금 해제**: 반 선생님이 제출한 출석부를 수정해야 할 경우 언제든 잠금 해제 가능
  - **연도별 관리**: 매년 새해마다 새 연도(예: 2027년) 출석부를 개설하고 이전 목장 구조를 원클릭으로 복사/이월

- **반 선생님**
  - **세션 자동 유지**: 한번 로그인하면 브라우저/앱을 닫아도 로그인 상태가 유지됩니다.
  - **전용 목장 출석부**: 로그인 시 본인이 맡은 반의 출석부만 안전하게 접근
  - **아이들(학생) 관리**: 반 아이들 등록, 수정, 삭제 (이름, 학년, 성별, 생년월일, 연락처, 부모님 연락처, 비고)
  - **실시간 자동 저장 체크박스**: 출석, 성경읽기, 대표기도 등 체크박스 클릭 시 **즉시 DB에 자동 저장** (저장 중/저장 완료 인디케이터 제공)
  - **오늘의 달란트 자동 계산**: 체크박스 클릭 시 설정된 달란트가 학생별로 실시간 계산되어 표시
  - **출석 제출하기 (읽기모드 잠금)**: 당일 출석 작성을 마치고 제출 버튼을 누르면 읽기 전용으로 잠겨 실수를 방지하고 축하 컨페티 효과 발생

---

## 📱 모바일 웹앱 (PWA) 설치 방법 (iOS / 안드로이드 모두 지원)

### 안드로이드 (Android / Chrome)
1. 크롬(Chrome) 브라우저로 사이트에 접속합니다.
2. 화면 하단에 표시되는 **[소년부 출석부 앱 설치]** 버튼을 누르거나, 우측 상단 메뉴(⋮)에서 **[앱 설치]** 또는 **[홈 화면에 추가]**를 누릅니다.
3. 바탕화면에 앱 아이콘이 생성되어 일반 앱처럼 실행됩니다.

### 아이폰 (iOS / Safari)
1. 사파리(Safari) 브라우저로 사이트에 접속합니다.
2. 하단 중앙의 **공유 아이콘 (네모 위 화살표 모양)**을 탭합니다.
3. 메뉴를 아래로 스크롤하여 **[홈 화면에 추가]**를 누른 뒤 **[추가]**를 누릅니다.
4. 홈 화면에 소년부 출석부 아이콘이 생성되며, 브라우저 주소창 없이 전체화면 네이티브 앱처럼 동작합니다.

---

## 🚀 로컬 실행 방법

```bash
# 1. 의존성 설치 (이미 완료됨)
npm install

# 2. 로컬 개발 서버 실행
npm run dev

# 3. 브라우저에서 접속
http://localhost:5173
```

---

## 🔑 빠른 테스트용 계정 (간편 아이디 로그인)

복잡한 이메일 대신 **간편한 목장 번호(1-1목장은 11, 2-1목장은 21 등)**로 바로 로그인할 수 있습니다:

| 구분 | 성함 / 직분 | 로그인 아이디 | 초기 비밀번호 | 접근 권한 | 비밀번호 변경 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **관리자** | 담당 목사님 | `pastor` | `admin1234` | 소년부 전체 관리자 | 관리자 화면에서 변경 가능 |
| **관리자** | 서기 선생님 | `clerk` | `admin1234` | 소년부 전체 관리자 | 관리자 화면에서 변경 가능 |
| **반 선생님** | 1부 1목장 김은혜 선생님 | `11` | `1234` | 1부 1목장 전용 출석부 | 관리자 화면에서 변경 가능 |
| **반 선생님** | 1부 2목장 이요한 선생님 | `12` | `1234` | 1부 2목장 전용 출석부 | 관리자 화면에서 변경 가능 |
| **반 선생님** | 1부 14목장 송시우 선생님 | `114` | `1234` | 1부 14목장 전용 출석부 | 관리자 화면에서 변경 가능 |
| **반 선생님** | 2부 1목장 박다윗 선생님 | `21` | `1234` | 2부 1목장 전용 출석부 | 관리자 화면에서 변경 가능 |
| **반 선생님** | 2부 7목장 남궁찬 선생님 | `27` | `1234` | 2부 7목장 전용 출석부 | 관리자 화면에서 변경 가능 |

---

## ☁️ 100% 평생 무료 Cloud DB & 호스팅 배포 가이드 (Google Firebase)

본 프로젝트는 **Google Firebase 무료 요금제(Spark Plan)**를 기준으로 설계되어 있어 교회에서 비용 부담 없이 평생 무료로 운영할 수 있습니다.

### Firebase 무료 티어 스펙:
- **Cloud Firestore**: 일일 읽기 50,000회, 쓰기 20,000회 (소년부 주일 출석 체크에 차고 넘침)
- **Firebase Authentication**: 무제한 무료
- **Firebase Hosting**: 무료 SSL(https), 글로벌 CDN 및 커스텀 도메인 무료 연결

### 1단계: Firebase 프로젝트 생성 (3분)
1. [Firebase Console](https://console.firebase.google.com/)에 구글 계정으로 로그인합니다.
2. **[프로젝트 추가]** 클릭 -> 프로젝트 이름 입력 (예: `bujeon-church-attendance`) -> 만들기 완료.
3. 좌측 메뉴 **[빌드] > [Firestore Database]** 클릭 -> **[데이터베이스 만들기]** 클릭 (프로덕션 모드 또는 테스트 모드).
4. 좌측 메뉴 **[빌드] > [Authentication]** 클릭 -> **[시작하기]** -> 로그인 제공업체에서 **[이메일/비밀번호]** 사용 설정.

### 2단계: 웹 앱 등록 및 키 복사
1. 프로젝트 개요 우측의 **웹 아이콘 `</>`** 클릭 -> 앱 닉네임 입력 후 등록.
2. 화면에 나타나는 `firebaseConfig` 객체를 복사합니다:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "bujeon-church.firebaseapp.com",
  projectId: "bujeon-church",
  storageBucket: "bujeon-church.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3단계: 앱에 키 적용하기
- 출석부 앱 상단 헤더의 **`[설정]`** 버튼을 누르고 복사한 JSON을 붙여넣기만 하면 즉시 모든 기기와 **실시간 클라우드 DB 동기화**가 활성화됩니다!
- 또는 프로젝트 루트에 `.env` 파일을 만들어 환경 변수로 지정할 수도 있습니다:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=bujeon-church.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bujeon-church
VITE_FIREBASE_STORAGE_BUCKET=bujeon-church.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4단계: 무료 배포 (Hosting)
Firebase CLI를 통해 한 줄로 배포할 수 있습니다:
```bash
# 1. Firebase 도구 설치
npm install -g firebase-tools

# 2. 로그인 및 초기화
firebase login
firebase init hosting
# (기존 프로젝트 선택 -> public 디렉토리: dist -> single-page app: Yes)

# 3. 빌드 및 배포
npm run build
firebase deploy
```
배포가 완료되면 `https://your-project.web.app` 형태의 고유 URL이 발급되며, 모든 선생님들이 스마트폰으로 즉시 접속하여 사용할 수 있습니다.

---

## 📁 프로젝트 폴더 구조

```
src/
├── api/
│   ├── firebase.js          # Firebase SDK 초기화 및 클라우드 연동
│   └── storage.js           # Firestore 및 로컬 스토리지 통합 NoSQL 서비스 레이어
├── stores/
│   ├── authStore.js         # 로그인 세션 유지, 권한 관리
│   ├── churchStore.js       # 연도, 목장(1부 14목장/2부 7목장), 체크항목/달란트, 학생
│   └── attendanceStore.js   # 실시간 출석 체크, 자동저장, 제출(잠금), 달란트 계산
├── views/
│   ├── LoginView.vue        # 로그인 화면 (원클릭 간편 프리셋 포함)
│   ├── teacher/
│   │   ├── TeacherLayout.vue   # 선생님 모바일 네비게이션
│   │   ├── AttendanceView.vue  # 출석 체크박스, 실시간 자동저장, 제출 잠금
│   │   └── StudentsView.vue    # 반 아이들 등록/수정/삭제
│   └── admin/
│       ├── AdminLayout.vue     # 관리자 메뉴
│       ├── DashboardView.vue   # 1부/2부 전체 출석 통계, 마감 해제
│       ├── GroupsView.vue      # 1부 14개, 2부 7개 목장 추가/수정/삭제
│       ├── TeachersView.vue    # 선생님 계정 생성 및 목장 배정
│       ├── SettingsView.vue    # 성경읽기/대표기도 등 항목 추가 & 달란트 설정, 연도 관리
│       └── TalentStatsView.vue # 월별 달란트 집계 랭킹 & 엑셀 다운로드
├── components/
│   ├── AppHeader.vue        # 상단 공통 헤더
│   ├── Modal.vue            # 공통 팝업 모달
│   └── PwaInstallPrompt.vue # iOS / Android PWA 앱 설치 안내
├── App.vue
└── main.js
```
