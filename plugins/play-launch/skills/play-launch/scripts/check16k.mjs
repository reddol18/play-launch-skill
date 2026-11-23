// check16k.mjs — 64비트 .so 의 PT_LOAD 정렬(p_align)이 16KB(16384) 이상인지 검사한다.
// 사용법: node check16k.mjs <풀어 둔 AAB 폴더 또는 stripped_native_libs 폴더>
import fs from 'node:fs';
import path from 'node:path';
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
if (!process.argv[2]) {
  console.error('사용법: node check16k.mjs <풀어 둔 AAB 폴더 또는 stripped_native_libs 폴더>');
  process.exit(2);
}
for (const f of walk(process.argv[2]).filter(f => f.endsWith('.so'))) {
  const b = fs.readFileSync(f);
  if (b[4] !== 2) continue;                       // ELF64만 (32비트는 대상 아님)
  const phoff = Number(b.readBigUInt64LE(0x20));
  const phentsize = b.readUInt16LE(0x36), phnum = b.readUInt16LE(0x38);
  let min = Infinity;
  for (let i = 0; i < phnum; i++) {
    const o = phoff + i * phentsize;
    if (b.readUInt32LE(o) === 1)                  // PT_LOAD
      min = Math.min(min, Number(b.readBigUInt64LE(o + 0x30)));
  }
  console.log(min >= 16384 ? 'OK  ' : 'FAIL', min, path.relative(process.argv[2], f));
}
