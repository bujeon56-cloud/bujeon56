export function compareGroups(a, b) {
  const department = group => group.departmentId === 'part1' ? 1 : group.departmentId === 'part2' ? 2 : Number(String(group.departmentName || '').match(/[12](?=부)/)?.[0]) || 99;
  const number = group => {
    const name = String(group.name || '').normalize('NFKC');
    const label = name.match(/(\d+)\s*(?:목장|반)/)?.[1] || name.match(/\d+/)?.[0];
    return Number(label) > 0 ? Number(label) : Number(group.order) > 0 ? Number(group.order) : Infinity;
  };
  if (department(a) !== department(b)) return department(a) - department(b);
  if (number(a) !== number(b)) return number(a) - number(b);
  return 0;
}
