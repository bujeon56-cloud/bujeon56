import {compareGroups, groupNumber} from './groupOrder.js';

export function classLoginEmail(identifier) {
  let value = String(identifier).normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase();
  if (value === 'bujeon56') return 'bujeon56@accounts.bujeon56.invalid';
  if (/^[\d\s-]+$/.test(value)) value = value.replace(/[\s-]/g, '');
  if (/^20\d{2}0[12](?:0[1-9]|[1-9]\d)$/.test(value)) value = value.slice(2);
  return /^(?:\d{2}0[12](?:0[1-9]|[1-9]\d)|\d{2}[12][1-9]\d?)$/.test(value) ? `${value}@accounts.bujeon56.invalid` : value;
}

export function classes2026() {
  return [1, 2].flatMap(part => Array.from({ length: part === 1 ? 14 : 8 }, (_, index) => {
    const order = index + 1;
    const code = `26${String(part).padStart(2, '0')}${String(order).padStart(2, '0')}`;
    return { code, email: classLoginEmail(code), year: '2026', departmentId: `part${part}`, departmentName: `${part}부`, name: `${order}목장`, order, id: `part${part}_2026_g${order}` };
  }));
}

export function classesForYear(groups, year) {
  year=String(year);
  if (!/^20\d{2}$/.test(year)) throw new Error('연도를 확인해주세요.');
  const codes=new Set();
  return groups.filter(group=>String(group.year)===year).sort(compareGroups).map(group=>{
    const part={part1:'01',part2:'02'}[group.departmentId];
    const order=groupNumber(group);
    if(!part || !Number.isInteger(order) || order<1 || order>99) throw new Error('목장 부서와 번호(1~99)를 확인해주세요: '+group.name);
    const code=year.slice(2)+part+String(order).padStart(2,'0');
    if(codes.has(code))throw new Error('같은 부서에 목장 번호가 중복되어 있습니다: '+group.name);
    codes.add(code);
    return {...group,year,order,code,email:classLoginEmail(code)};
  });
}

export function initialPassword(code) {
  if (!/^\d{6}$/.test(code)) throw new Error('목장 아이디는 6자리여야 합니다.');
  return `@${code}#`;
}

export function parseTeacherRoster(text, rows, { year = rows[0]?.year, onInvalid, onNewGroup } = {}) {
  const result = new Map();
  const firstLines = new Map();
  const invalid = message => {
    if (!onInvalid) throw new Error(message);
    onInvalid(message);
  };
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const input = line.trim();
    if (!input) continue;
    const normalized = input.normalize('NFKC');
    const columns = (line.includes('\t') || /[,，]/.test(line)
      ? line.split(line.includes('\t') ? '\t' : /[,，]/)
      : normalized.match(/^(\d+\s*부)\s*(\d+\s*(?:목장|반))\s+(.+)$/)?.slice(1) ?? [])
      .map(value => value.trim().replace(/^"(.*)"$/, '$1').trim());
    if (['부서', '부서번호'].includes(columns[0]) && ['목장', '목장번호', '반', '반번호'].includes(columns[1]?.replace(/\s/g, ''))) continue;

    const [department, group, name] = columns;
    const codeInput = department?.normalize('NFKC') || '';
    const byCode = columns.length === 2 && /^\d{6}$/.test(codeInput);
    const part = codeInput.match(/^0?([12])\s*(?:부)?$/)?.[1];
    const groupLabel = group?.normalize('NFKC') || '';
    const number = Number(groupLabel.match(/^(\d{1,2})\s*(?:목장|반)?$/)?.[1]
      || groupLabel.match(/^(?:목장|반)\s*(\d{1,2})$/)?.[1]);
    const lineNumber = index + 1;
    const teacherName = byCode ? group : name;
    if (!teacherName || (!byCode && (columns.length !== 3 || !part || !(number > 0)))) {
      invalid(`${lineNumber}행: 부서,목장번호,선생님 형식으로 입력해주세요. 예: 1부,2목장,홍길동`);
      continue;
    }
    let row = rows.find(row => byCode ? row.code === codeInput : row.departmentId === 'part' + part && row.order === number);
    const label = byCode ? `아이디 ${codeInput}` : `${part}부 ${number}목장`;
    const newPart = byCode ? codeInput[3] : part;
    const order = byCode ? Number(codeInput.slice(4)) : number;
    if (!row && onNewGroup && /^20\d{2}$/.test(year) && ['1', '2'].includes(newPart) && order > 0
      && (!byCode || (codeInput.startsWith(year.slice(2)) && codeInput[2] === '0'))) {
      const departmentId = 'part' + newPart;
      const code = year.slice(2) + '0' + newPart + String(order).padStart(2, '0');
      row = { id: `${departmentId}_${year}_g${order}`, year, departmentId, departmentName: newPart + '부',
        order, name: order + '목장', code, email: classLoginEmail(code), newGroup: true };
    }
    if (!row) {
      invalid(`${lineNumber}행: ${year ? year + '년 ' : ''}${label}이 목록에 없습니다. 아래 목장 목록을 확인해주세요.`);
      continue;
    }
    if (result.has(row.code)) {
      invalid(`${lineNumber}행: ${label}이 ${firstLines.get(row.code)}행에도 입력됐습니다.`);
      continue;
    }
    result.set(row.code, teacherName);
    firstLines.set(row.code, lineNumber);
    if (row.newGroup && !rows.some(existing => existing.code === row.code)) onNewGroup?.(row);
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
