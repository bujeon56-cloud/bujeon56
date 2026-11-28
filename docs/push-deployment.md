# 출석부 푸시 배포

PWA 화면은 기존 GitHub Pages에 배포합니다. 푸시 발송과 관리자 수정 이력에는 별도의 Firebase 배포가 필요합니다.

1. Firebase 프로젝트에 Cloud Functions 배포 권한과 Blaze 요금제가 있는지 확인합니다.
2. `npm ci --prefix functions`로 발송 함수의 의존성을 설치합니다.
3. `npx --prefix functions web-push generate-vapid-keys`로 VAPID 키 쌍을 생성합니다. `PUSH_VAPID_PUBLIC_KEY`와 유효한 지원 연락처 URI인 `PUSH_VAPID_SUBJECT`를 Functions 배포 환경에 설정합니다. 개인 키는 `npx firebase functions:secrets:set PUSH_VAPID_PRIVATE_KEY`로 등록합니다.
4. `npx firebase deploy --only firestore:rules,functions`로 이력 접근 규칙과 발송 함수를 배포한 다음 PWA 화면을 배포합니다.
5. 테스트용 반 계정으로 설치된 PWA에서 종 모양 버튼을 누르고 알림을 허용합니다. 관리자 화면에서 해당 목장에 테스트 메시지를 보내 앱이 닫힌 상태와 알림 클릭을 확인합니다. 전체 발송과 미제출 발송은 테스트용 반을 나눠 대상이 올바른지 확인합니다.

현재 전체 발송 범위는 선택한 연도에 반이 배정된 선생님입니다. 발송 화면의 성공 건수는 푸시 중계 서버가 접수한 기기 수입니다. 아이폰에서는 홈 화면에 설치한 앱을 열고 직접 알림을 허용해야 합니다.
