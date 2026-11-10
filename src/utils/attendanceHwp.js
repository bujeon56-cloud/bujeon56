// HWP 5.0 records, per Hancom's published file format. The bundled styles contain no report text.
import styles from './attendanceHwpStyles.json' with { type: 'json' };

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

function record(tag, level, data) {
  const extended = data.length >= 4095;
  const header = new Uint8Array(extended ? 8 : 4);
  view(header).setUint32(0, tag | (level << 10) | (Math.min(data.length, 4095) << 20), true);
  if (extended) view(header).setUint32(4, data.length, true);
  return join([header, data]);
}

function paragraph(text, level, { prefix = new Uint8Array(), controlMask = 0, last = true } = {}) {
  const body = join([prefix, utf16(text.replace(/[\u0000-\u0009\u000b-\u001f]/g, ' ') + '\r')]);
  const header = bytes('paragraph');
  const properties = view(header);
  properties.setUint32(0, body.length / 2 + (last ? 0x80000000 : 0), true);
  properties.setUint32(4, controlMask, true);
  const charShape = new Uint8Array(8);
  return join([
    record(66, level, header), ...(body.length > 2 ? [record(67, level + 1, body)] : []),
    record(68, level + 1, charShape), record(69, level + 1, bytes('line'))
  ]);
}

function reportTable(rows, merges) {
  const columnCount = 8;
  const columnWidth = 5400;
  const cells = [];
  const definition = new Uint8Array(22 + 2 * rows.length);
  definition.set(bytes('tableDefinition'));
  const tableProperties = view(definition);
  tableProperties.setUint16(4, rows.length, true);
  tableProperties.setUint16(6, columnCount, true);
  tableProperties.setUint16(18 + 2 * rows.length, 3, true);
  let tableHeight = 0;

  for (const [row, values] of rows.entries()) {
    const rowMerges = merges.filter(merge => merge.row === row);
    let rowHeight = 2100;
    const rowCells = [];
    for (let column = 0; column < columnCount;) {
      const merge = rowMerges.find(item => item.start === column);
      const span = merge ? merge.end - merge.start + 1 : 1;
      const text = String(values[column] ?? '');
      const estimatedLines = text.split('\n').reduce((count, line) => count + Math.max(1, Math.ceil(line.length / (span * 6))), 0);
      rowHeight = Math.max(rowHeight, estimatedLines * 1250 + 650);
      rowCells.push({ column, span, text });
      column += span;
    }
    tableHeight += rowHeight;
    tableProperties.setUint16(18 + row * 2, rowCells.length, true);
    for (const { column, span, text } of rowCells) {
      const cell = bytes('tableCell');
      const cellProperties = view(cell);
      cellProperties.setUint16(8, column, true);
      cellProperties.setUint16(10, row, true);
      cellProperties.setUint16(12, span, true);
      cellProperties.setUint32(16, columnWidth * span, true);
      cellProperties.setUint32(20, rowHeight, true);
      cellProperties.setUint32(34, columnWidth * span, true);
      cells.push(record(72, 2, cell), paragraph(text, 2));
    }
  }

  const control = bytes('tableControl');
  const controlProperties = view(control);
  controlProperties.setUint32(12, 0, true);
  controlProperties.setUint32(16, columnWidth * columnCount, true);
  controlProperties.setUint32(20, tableHeight, true);
  return join([record(71, 1, control), record(77, 2, definition), ...cells]);
}

export function createAttendanceHwp(CFB, { rows, merges }) {
  const [title, ...tableRows] = rows;
  const section = join([
    paragraph(String(title[0]), 0, { prefix: bytes('sectionTextControls'), controlMask: 4, last: false }),
    bytes('sectionControls'),
    paragraph('', 0, { prefix: bytes('tableTextControl'), controlMask: 0x800, last: false }),
    reportTable(tableRows, merges.filter(merge => merge.row > 0).map(merge => ({ ...merge, row: merge.row - 1 }))),
    paragraph('', 0)
  ]);
  const file = CFB.utils.cfb_new();
  CFB.utils.cfb_add(file, 'FileHeader', bytes('fileHeader'));
  CFB.utils.cfb_add(file, 'DocInfo', bytes('docInfo'));
  CFB.utils.cfb_add(file, 'BodyText/Section0', section);
  CFB.utils.cfb_add(file, 'PrvText', utf16(rows.map(row => row.join('\t')).join('\r\n').slice(0, 1000)));
  return CFB.write(file, { type: 'array' });
}
