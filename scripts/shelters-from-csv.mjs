#!/usr/bin/env node
/**
 * 행정안전부 무더위쉼터 CSV → src/data/shelters.json 변환 스크립트
 *
 * 사용법:
 *   1. 공공데이터포털(data.go.kr)에서 "무더위쉼터" CSV 다운로드
 *   2. node scripts/shelters-from-csv.mjs 무더위쉼터.csv
 *   3. src/data/shelters.json이 전체 데이터로 교체돼요
 *
 * 헤더에서 명칭/위도/경도 컬럼을 자동으로 찾아요 (쉼터명칭, 시설명, 위도, 경도 등 변형 대응).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('사용법: node scripts/shelters-from-csv.mjs <무더위쉼터.csv>');
  process.exit(1);
}

const text = readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/).filter((l) => l.trim());
const header = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());

const nameIdx = header.findIndex((h) => /명칭|시설명|쉼터명/.test(h));
const latIdx = header.findIndex((h) => /위도|lat/i.test(h));
const lngIdx = header.findIndex((h) => /경도|lon|lng/i.test(h));
if (nameIdx < 0 || latIdx < 0 || lngIdx < 0) {
  console.error(`컬럼을 찾지 못했어요. 헤더: ${header.join(', ')}`);
  process.exit(1);
}

const shelters = lines
  .slice(1)
  .map((line) => line.split(','))
  .map((cols) => ({
    name: (cols[nameIdx] ?? '').replace(/"/g, '').trim(),
    lat: Number(cols[latIdx]),
    lng: Number(cols[lngIdx]),
  }))
  .filter((s) => s.name && Number.isFinite(s.lat) && Number.isFinite(s.lng));

const out = {
  source: `행정안전부 무더위쉼터 공공데이터 (${file}, ${shelters.length}곳)`,
  shelters,
};
writeFileSync('src/data/shelters.json', JSON.stringify(out, null, 2));
console.log(`src/data/shelters.json에 ${shelters.length}곳을 저장했어요.`);
