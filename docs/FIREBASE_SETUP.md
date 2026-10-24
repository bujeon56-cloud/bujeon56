# Firebase 최초 연결

웹 앱은 `bujeon56-356f9` 프로젝트를 사용합니다. Firebase 웹 설정값은 공개 식별 정보이며, 실제 접근은 Firebase Authentication과 Firestore 규칙으로 제한합니다. Analytics는 사용하지 않습니다.

## 콘솔에서 한 번만 할 작업

1. https://console.firebase.google.com/project/bujeon56-356f9 에 접속합니다.
2. **빌드 → Authentication → 시작하기 → 로그인 방법 → 이메일/비밀번호**를 사용 설정합니다.
3. Authentication의 **설정 → 승인된 도메인**에 `bujeon56-cloud.github.io`를 추가합니다. 경로(`/bujeon56/`)는 넣지 않습니다.
4. **빌드 → Firestore Database → 데이터베이스 만들기**에서 **Standard / 기본(default) DB**, **프로덕션 모드**, 원하는 리전을 선택합니다. 아직 DB를 만들지 않았다면 서울(`asia-northeast3`)을 선택할 수 있습니다. 기존 DB의 위치는 변경하지 않습니다.
5. Firestore **규칙** 탭에 저장소 루트의 `firestore.rules` 내용을 전부 붙여넣고 **게시**합니다. `allow read, write: if true` 규칙은 사용하지 않습니다.
6. **Authentication → 사용자 → 사용자 추가**에서 최초 관리자 본인의 실제 이메일과 안전한 비밀번호를 등록합니다. 생성된 사용자의 **UID**를 복사합니다.
7. **Firestore → 데이터 → 컬렉션 시작**에서 `users`를 만듭니다. 문서 ID를 위 UID와 정확하게 같게 하고, 다음 필드를 문자열로 추가합니다.

   | 필드 | 값 예시 |
   |---|---|
   | `name` | 담당 목사님 |
   | `email` | Authentication에 등록한 이메일 |
   | `role` | `admin` |
   | `position` | 목사님 |

   비밀번호는 Firestore에 넣지 않습니다. 관리자 권한은 콘솔에서 최초 한 번 직접 부여하며 앱에서 누구나 관리자 등록을 할 수는 없습니다.
8. https://bujeon56-cloud.github.io/bujeon56/ 에서 위 이메일과 비밀번호로 로그인합니다. 처음에는 빈 명단과 현재 연도, 기본 출석 항목(2점)만 생성됩니다.
9. 관리자 화면에서 반 생성 → 선생님 등록(실제 이메일, 6자 이상 초기 비밀번호) → 반 배정 → 학생 등록을 진행합니다. 성경읽기 등 추가 달란트 항목은 설정에서 추가합니다.

## 운영 동작

- 모든 기기에서 이메일/비밀번호로 로그인합니다. 과거 체험 계정과 공용 비밀번호는 사용할 수 없습니다.
- 교사는 자신의 UID가 `teacherId`로 배정된 반과 해당 학생만 조회·수정할 수 있습니다. 관리자는 전체를 관리합니다.
- 앱에서 선생님을 생성하면 Firebase Auth 사용자도 생성합니다. 비밀번호는 Auth에만 전달하고 DB에는 저장하지 않습니다. 관리자 로그인은 유지됩니다.
- 계정 생성 후 프로필 저장이 실패하면 새 Auth 계정을 가능한 범위에서 정리합니다. 네트워크 오류로 Auth에만 남은 계정은 콘솔에서 확인 후 정리합니다.
- 비밀번호 변경은 재설정 이메일로 처리합니다. 선생님 이메일 변경은 Auth 콘솔과 Firestore `users/{UID}.email`에 동일하게 반영해야 합니다.
- 선생님 삭제는 `users/{UID}`를 제거해 즉시 DB 접근 권한을 없앱니다. Auth 계정까지 완전히 삭제하려면 Authentication 콘솔에서도 해당 UID를 삭제합니다. 과거 출석 기록과 교사 이름은 보존합니다.
- DB 권한/통신 오류가 발생하면 브라우저 저장소에 대신 저장하지 않습니다. 저장 실패를 확인하고 연결을 복구해야 합니다.
- 기존 휴대폰의 데모 데이터는 자동 업로드하지 않습니다. 실제 명단을 새로 등록합니다.
- GitHub Pages 배포와 Firebase 규칙 배포는 별개입니다. `.github/workflows/deploy.yml`은 웹 앱만 배포합니다. 규칙을 수정했다면 콘솔에서 다시 게시해야 합니다.

## 개발 및 검증

```sh
npm ci
npm run test:unit
npm run test:rules
npm run build
```

권한 테스트는 Java 21 이상이 필요하고 `demo-bujeon56` 로컬 에뮬레이터만 사용합니다. 운영 프로젝트에 테스트 데이터를 쓰지 않습니다.

CLI로 규칙을 게시하려는 경우 본인 구글 계정으로 `npx firebase login` 후 `npx firebase deploy --only firestore:rules --project bujeon56-356f9`를 실행합니다. 서비스 계정 비공개 키를 코드나 채팅에 올리지 않습니다.
