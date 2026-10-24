export function classLoginEmail(identifier) {
  const value = String(identifier).trim().toLowerCase();
  return /^(?:\d{2}0[12](?:0[1-9]|[1-9]\d)|\d{2}[12][1-9]\d?)$/.test(value) ? `${value}@accounts.bujeon56.invalid` : value;
}

export function classes2026() {
  return [1, 2].flatMap(part => Array.from({ length: part === 1 ? 14 : 8 }, (_, index) => {
    const order = index + 1;
    const code = `26${String(part).padStart(2, '0')}${String(order).padStart(2, '0')}`;
    return { code, email: classLoginEmail(code), year: '2026', departmentId: `part${part}`, departmentName: `${part}부`, name: `${order}목장`, order, id: `part${part}_2026_g${order}` };
  }));
}

export function initialPassword(code) {
  if (!/^\d{6}$/.test(code)) throw new Error('목장 아이디는 6자리여야 합니다.');
  return code;
}

export function parseTeacherRoster(text) {
  const result = new Map();
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const columns = line.split(',').map(value => value.trim());
    const [part, order, name] = columns;
    if (columns.length !== 3 || !['1', '2'].includes(part) || !/^[1-9]\d?$/.test(order || '') || !name) throw new Error((index + 1) + '행: 부서,목장번호,선생님 형식으로 입력해주세요.');
    const row = classes2026().find(row => row.departmentId === 'part' + part && row.order === Number(order));
    if (!row || result.has(row.code)) throw new Error((index + 1) + '행: 없는 목장이거나 중복된 목장입니다.');
    result.set(row.code, name);
  }
  return result;
}

export function credentialCsv(rows) {
  const cell = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  return '\uFEFF' + [['연도', '부서', '목장', '담당 선생님', '로그인 아이디', '초기 비밀번호'], ...rows.map(row => [row.year, row.departmentName, row.name, row.teacherName, row.code, row.password])].map(row => row.map(cell).join(',')).join('\r\n');
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
