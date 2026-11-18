const iosFinish = '‘웹 앱으로 열기’가 보이면 켜고 ‘추가’를 누르세요.';
const safariSteps = 'Safari의 공유 메뉴에서 ‘홈 화면에 추가’를 선택하세요.';

export function getPwaInstallGuide({ userAgent, platform, maxTouchPoints }) {
  const ios = /iPhone|iPad|iPod/i.test(userAgent) ||
    (platform === 'MacIntel' && maxTouchPoints > 1);
  const android = /Android/i.test(userAgent);
  const inApp = /KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp|Line\/|; wv\)/i.test(userAgent);

  if (ios) {
    if (inApp) return `이 주소를 Safari에서 연 뒤 설치하세요. ${safariSteps} ${iosFinish}`;
    if (/CriOS\//i.test(userAgent)) {
      return 'Chrome 주소창 오른쪽의 공유 → 홈 화면에 추가 → 추가를 누르세요. 메뉴에 없으면 Safari에서 열어 추가하세요.';
    }
    if (/Version\/.*Safari\//i.test(userAgent) && !/EdgiOS|FxiOS|OPiOS/i.test(userAgent)) {
      return `${safariSteps} 공유 버튼이 안 보이면 페이지 메뉴에서 찾으세요. ${iosFinish}`;
    }
    return '브라우저의 공유 메뉴에서 ‘홈 화면에 추가’를 찾으세요. 메뉴에 없으면 Safari에서 열어 추가하세요.';
  }

  if (android) {
    if (inApp) return '이 주소를 Chrome이나 삼성 인터넷에서 열고 앱을 설치하세요.';
    if (/SamsungBrowser\//i.test(userAgent)) {
      return '삼성 인터넷 주소창의 + 버튼을 누르세요. 버튼이 없으면 메뉴(☰) → 페이지 추가 → 홈 화면을 선택하세요.';
    }
    if (/Chrome\//i.test(userAgent) && !/EdgA\/|OPR\/|YaBrowser\/|UCBrowser\//i.test(userAgent)) {
      return 'Chrome 메뉴(⋮)에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.';
    }
    return '브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 찾으세요. 메뉴에 없으면 Chrome이나 삼성 인터넷에서 열어 설치하세요.';
  }

  return '';
}
