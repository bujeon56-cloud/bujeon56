// The template stores the reference HWP's page and table records with its report data removed.
import styles from './attendanceHwpStyles.json' with { type: 'json' };
import { attendanceRowCells, attendanceNoteCells } from './attendanceReportExport.js';

const GROUP_ROWS_PER_PAGE = 14;
const PARA_HEADER = 66;
const PARA_TEXT = 67;
const CELL = 72;
const TABLE = 77;

const bytes = key => Uint8Array.from(atob(styles[key]), char => char.charCodeAt(0));
const view = data => new DataView(data.buffer, data.byteOffset, data.byteLength);

function join(buffers) {
  const data = new Uint8Array(buffers.reduce((size, buffer) => size + buffer.length, 0));
  let offset = 0;
  for (const buffer of buffers) {
    data.set(buffer, offset);
    offset += buffer.length;
  }
  return data;
}

function utf16(text) {
  const data = new Uint8Array(text.length * 2);
  const target = view(data);
  for (let index = 0; index < text.length; index++) target.setUint16(index * 2, text.charCodeAt(index), true);
  return data;
}

function records(data) {
  const result = [];
  const source = view(data);
  for (let offset = 0; offset < data.length;) {
    const start = offset;
    const header = source.getUint32(offset, true);
    offset += 4;
    let size = header >>> 20;
    if (size === 4095) {
      size = source.getUint32(offset, true);
      offset += 4;
    }
    const payload = data.subarray(offset, offset += size);
    result.push({ tag: header & 1023, level: (header >>> 10) & 1023, payload, raw: data.subarray(start, offset) });
  }
  return result;
}

function record(tag, level, data) {
  const extended = data.length >= 4095;
  const header = new Uint8Array(extended ? 8 : 4);
  view(header).setUint32(0, tag | (level << 10) | (Math.min(data.length, 4095) << 20), true);
  if (extended) view(header).setUint32(4, data.length, true);
  return join([header, data]);
}

function paragraphText(header, text, prefix = new Uint8Array()) {
  const properties = header.payload.slice();
  const lastFlag = view(properties).getUint32(0, true) & 0x80000000;
  const cleanText = String(text).replace(/[\r\n]+/g, ' · ').replace(/[\u0000-\u001f]/g, ' ');
  const body = join([prefix, utf16(`${cleanText}\r`)]);
  view(properties).setUint32(0, lastFlag | (body.length / 2), true);
  return [record(PARA_HEADER, header.level, properties), ...(body.length > 2 ? [record(PARA_TEXT, header.level + 1, body)] : [])];
}

function pageSection(template, report, offset) {
  const { title, rowPairs, parts, totals } = report;
  const includeSummary = offset === 0;
  const noteRows = includeSummary ? attendanceNoteCells(report) : [];
  const dataRows = rowPairs.slice(offset, offset + GROUP_ROWS_PER_PAGE).map(pair => pair.flatMap(attendanceRowCells));
  const subtotals = parts.flatMap(part => ['', part.totals.male, part.totals.female, part.totals.total]);
  const combined = [totals.male, totals.female, totals.total];
  const page = paragraphText(template[0], title, template[1].payload.subarray(0, 48));
  let table = 0;

  for (let index = 2; index < template.length; index++) {
    const entry = template[index];
    page.push(entry.raw);
    if (entry.tag === TABLE) table++;
    if (entry.tag !== CELL) continue;

    const column = view(entry.payload).getUint16(8, true);
    const row = view(entry.payload).getUint16(10, true);
    let value;
    if (table === 1 && column % 2 === 1) value = noteRows[row]?.[(column - 1) / 2] ?? '';
    if (table === 2 && row >= 1 && row <= GROUP_ROWS_PER_PAGE) value = dataRows[row - 1]?.[column] ?? '';
    if (table === 2 && row === 16 && column % 4 !== 0) value = includeSummary ? subtotals[column] : '';
    if (table === 3 && row === 1) value = includeSummary ? combined[column] : '';
    if (value !== undefined) page.push(...paragraphText(template[++index], value));
  }
  return join(page);
}

export function createAttendanceHwp(CFB, report) {
  const template = records(bytes('section'));
  const pageCount = Math.max(1, Math.ceil(report.rowPairs.length / GROUP_ROWS_PER_PAGE));
  const docInfo = bytes('docInfo');
  view(docInfo).setUint16(4, pageCount, true); // Section count in the first document-properties record.
  const file = CFB.utils.cfb_new();
  CFB.utils.cfb_add(file, 'FileHeader', bytes('fileHeader'));
  CFB.utils.cfb_add(file, 'DocInfo', docInfo);
  for (let page = 0; page < pageCount; page++) {
    const section = pageSection(template, report, page * GROUP_ROWS_PER_PAGE);
    CFB.utils.cfb_add(file, `BodyText/Section${page}`, section);
  }
  CFB.utils.cfb_add(file, 'PrvText', utf16(report.title));
  return CFB.write(file, { type: 'array' });
}
