import type { RepositoryDownload } from './projectRepositoryService';

const encoder = new TextEncoder();
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
/** Standard uncompressed ZIP: no dependency, network request, or server-side project transfer. */
export function projectZip(files: RepositoryDownload[]): Uint8Array<ArrayBuffer> {
  if (files.length > 65535) throw new Error('This project has too many files for a ZIP. Download the complete JSON backup instead.');
  const locals: Uint8Array[] = [], central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    if (file.path.startsWith('/') || file.path.split('/').includes('..')) throw new Error('Invalid archive path.');
    const name = encoder.encode(file.path), data = typeof file.content === 'string' ? encoder.encode(file.content) : file.content, crc = crc32(data);
    if (offset + data.length > 0xffffffff) throw new Error('This project exceeds the ZIP size limit. Download individual records instead.');
    const header = new Uint8Array(30 + name.length), view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x800, true); view.setUint16(12, 33, true);
    view.setUint32(14, crc, true); view.setUint32(18, data.length, true); view.setUint32(22, data.length, true); view.setUint16(26, name.length, true); header.set(name, 30);
    const directory = new Uint8Array(46 + name.length), dv = new DataView(directory.buffer);
    dv.setUint32(0, 0x02014b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 20, true); dv.setUint16(8, 0x800, true); dv.setUint16(14, 33, true); dv.setUint32(16, crc, true); dv.setUint32(20, data.length, true); dv.setUint32(24, data.length, true); dv.setUint16(28, name.length, true); dv.setUint32(42, offset, true); directory.set(name, 46);
    locals.push(header, data); central.push(directory); offset += header.length + data.length;
  }
  const directoryLength = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22), view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true); view.setUint16(8, files.length, true); view.setUint16(10, files.length, true); view.setUint32(12, directoryLength, true); view.setUint32(16, offset, true);
  const output = new Uint8Array(offset + directoryLength + end.length);
  let position = 0; for (const part of [...locals, ...central, end]) { output.set(part, position); position += part.length; }
  return output;
}
export function downloadProjectZip(name: string, bytes: Uint8Array<ArrayBuffer>): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
