export function attendanceExportSheet(report) {
  const { title, rowPairs, parts, totals, noteLabels, milestoneNames, notes, unclassifiedCount } = report;
  const cells = row => row ? [row.label, row.hasMale ? row.male : '', row.hasFemale ? row.female : '', row.total] : ['', '', '', ''];
  const rows = [
    [title],
    ['1부', '남', '여', '합', '2부', '남', '여', '합'],
    ...rowPairs.map(pair => pair.flatMap(cells)),
    parts.flatMap(({ totals }) => ['총계', totals.male, totals.female, totals.total])
  ];
  const merges = [{ row: 0, start: 0, end: 7 }];
  rows.push(['1부 등반·새친구', '', '', '', '2부 등반·새친구']);
  merges.push({ row: rows.length - 1, start: 0, end: 3 }, { row: rows.length - 1, start: 4, end: 7 });

  for (const [index, label] of noteLabels.entries()) {
    const entries = milestoneNames.map((part, column) => [part[index], notes[index * 2 + column]].filter(Boolean).join('\n'));
    rows.push([label, entries[0], '', '', label, entries[1]]);
    merges.push({ row: rows.length - 1, start: 1, end: 3 }, { row: rows.length - 1, start: 5, end: 7 });
  }
  rows.push(['전체', '남', '여', '합'], ['총계', totals.male, totals.female, totals.total]);
  if (unclassifiedCount) {
    rows.push([`성별 미등록 ${unclassifiedCount}명은 합계에 포함됩니다.`]);
    merges.push({ row: rows.length - 1, start: 0, end: 7 });
  }
  return { rows, merges };
}

export function writeAttendanceExcel(XLSX, sheet, filename) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
  worksheet['!cols'] = [13, 11, 11, 11, 13, 11, 11, 11].map(wch => ({ wch }));
  worksheet['!merges'] = sheet.merges.map(({ row, start, end }) => ({ s: { r: row, c: start }, e: { r: row, c: end } }));
  XLSX.utils.book_append_sheet(workbook, worksheet, '출석 통계');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
