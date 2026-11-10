import { studentAttended } from './newcomers.js';

export function attendanceReportPart(groups, recordsByGroup, studentsForGroup, date) {
  const totals = { male: 0, female: 0, total: 0 };
  const rows = groups.map(group => {
    const records = recordsByGroup[group.id] || {};
    const row = {
      id: group.id,
      label: group.name?.match(/^(\d+)\s*(?:목장|반)$/)?.[1] || group.name || group.order,
      male: 0, female: 0, total: 0, hasMale: false, hasFemale: false
    };

    for (const student of studentsForGroup(group.id, date)) {
      const attended = studentAttended(student, date, records);
      if (student.gender === '남') {
        row.hasMale = true;
        row.male += Number(attended);
      }
      if (student.gender === '여') {
        row.hasFemale = true;
        row.female += Number(attended);
      }
      row.total += Number(attended);
    }

    totals.male += row.male;
    totals.female += row.female;
    totals.total += row.total;
    return row;
  });
  return { rows, totals };
}
