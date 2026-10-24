export function classLoginEmail(identifier) {
  const value = String(identifier).trim().toLowerCase();
  return /^\d{2}[12][1-9]\d?$/.test(value) ? `${value}@accounts.bujeon56.invalid` : value;
}

export function classes2026() {
  return [1, 2].flatMap(part => Array.from({ length: part === 1 ? 14 : 8 }, (_, index) => {
    const order = index + 1;
    const code = `26${part}${order}`;
    return { code, email: classLoginEmail(code), year: '2026', departmentId: `part${part}`, departmentName: `${part}부`, name: `${order}목장`, order, id: `part${part}_2026_g${order}` };
  }));
}

export function initialPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return 'Aa7!' + Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
}

export function credentialCsv(rows) {
  const cell = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  return '\uFEFF' + [['연도', '부서', '목장', '로그인 아이디', '초기 비밀번호'], ...rows.map(row => [row.year, row.departmentName, row.name, row.code, row.password])].map(row => row.map(cell).join(',')).join('\r\n');
}

// Runs sequentially so Firebase account creation quotas and partial failures are visible.
export async function provisionClasses(rows, services, report) {
  for (const row of rows) {
    if (row.status === 'created' || row.status === 'existing') continue;
    report(row.code, 'creating', '');
    try {
      const status = await services.provision(row);
      report(row.code, status, '');
    } catch (error) {
      report(row.code, 'failed', error.message || '생성 실패');
      // Keep later rows untouched so the administrator can retry the same saved credentials.
      break;
    }
  }
}
