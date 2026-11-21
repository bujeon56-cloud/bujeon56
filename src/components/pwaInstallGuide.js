const iosFinish = '‘웹 앱으로 열기’가 보이면 켠 뒤 ‘추가’를 누르세요.';
const safariSteps = ['Safari에서 공유 메뉴를 여세요. 공유 버튼은 페이지 메뉴 안에 있을 수 있습니다.', '‘홈 화면에 추가’를 선택하세요.', iosFinish];
const androidChromeSteps = ['Chrome 주소창 옆 메뉴(⋮)를 여세요.', '‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.'];

export function getPwaInstallGuide({ userAgent = '', platform = '', maxTouchPoints = 0 }) {
  const ios = /iPhone|iPad|iPod/i.test(userAgent) ||
    (platform === 'MacIntel' && maxTouchPoints > 1);
  const android = /Android/i.test(userAgent);
  const iosBrowser = /Version\/.*Safari\/|CriOS\/|EdgiOS\/|FxiOS\/|OPiOS\//i.test(userAgent);
  const embedded = /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|\bNAVER\b|DaumApps?|\bDaum\b|Line\/|GSA\/|MicroMessenger|TikTok|;\s*wv\b/i.test(userAgent) ||
    (ios && !iosBrowser);

  if (!ios && !android) return null;

  if (embedded) {
    const browser = ios ? 'Safari' : 'Chrome';
    return {
      description: `홈 화면에 추가하려면 ${browser}에서 출석부를 열어 주세요.`,
      showAddress: true,
      steps: [
        `앱 메뉴에 ‘외부 브라우저에서 열기’가 있으면 선택하세요. 메뉴가 없으면 아래 주소를 복사해 ${browser} 주소창에 붙여넣으세요.`,
        ...(ios ? safariSteps : androidChromeSteps)
      ]
    };
  }

  const description = '홈 화면에서 출석부를 바로 열 수 있어요.';
  if (ios) {
    if (/Version\/.*Safari\//i.test(userAgent)) return { description, steps: safariSteps };
    return {
      description,
      showAddress: true,
      steps: ['공유 메뉴에서 ‘홈 화면에 추가’를 찾아 선택하세요.', iosFinish, '메뉴에 없으면 주소를 복사해 Safari에서 열고 공유 → 홈 화면에 추가를 선택하세요.']
    };
  }

  if (/SamsungBrowser\//i.test(userAgent)) {
    return { description, steps: ['주소창의 추가(+) 버튼을 확인하세요.', '버튼이 없으면 메뉴(☰) → 페이지 추가 → 홈 화면을 선택하세요.'] };
  }

  if (/Chrome\//i.test(userAgent) && !/EdgA\/|OPR\/|YaBrowser\/|UCBrowser\//i.test(userAgent)) {
    return { description, steps: androidChromeSteps };
  }

  return {
    description,
    showAddress: true,
    steps: ['브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 찾으세요.', '메뉴에 없으면 주소를 복사해 Chrome에서 열고 다시 시도하세요.']
  };
}
