function iso(date) { return date.toISOString().slice(0,10); }
function calendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date=new Date(value+'T00:00:00Z');
  return Number.isNaN(date.getTime()) || iso(date)!==value ? null : date;
}
export function isSunday(value) { const date=calendarDate(value);return !!date && date.getUTCDay()===0; }
export function sundaysInYear(year) {
  const text=String(year);
  if (!/^[12]\d{3}$/.test(text)) return [];
  const date=new Date(text+'-01-01T00:00:00Z');
  date.setUTCDate(date.getUTCDate()+(7-date.getUTCDay())%7);
  const dates=[];
  while(String(date.getUTCFullYear())===text){dates.push(iso(date));date.setUTCDate(date.getUTCDate()+7);}
  return dates;
}
export function sundayForYear(year,preferred) {
  const dates=sundaysInYear(year);
  if(dates.includes(preferred))return preferred;
  if(calendarDate(preferred) && preferred.slice(0,4)===String(year))return dates.filter(date=>date<=preferred).at(-1)||dates[0];
  return dates[0]||'';
}
export function recentSunday(date=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const part=type=>parts.find(part=>part.type===type).value;
  const calendar=calendarDate(part('year')+'-'+part('month')+'-'+part('day'));
  calendar.setUTCDate(calendar.getUTCDate()-calendar.getUTCDay());
  return iso(calendar);
}
