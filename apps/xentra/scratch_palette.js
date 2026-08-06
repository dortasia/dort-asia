import fs from 'fs';

const paletteText = `
1	#FDE9E7	#D94841
2	#FFF3E4	#E67E22
3	#FFF8DB	#B8860B
4	#F6F8D7	#7A8F00
5	#EAF8E5	#2E8B57
6	#DFF7EC	#1F8A70
7	#E3FAF3	#00897B
8	#E4FBFA	#00838F
9	#E6F8FF	#0288D1
10	#EAF2FF	#3B82F6
11	#EEF3FF	#4F46E5
12	#F3F0FF	#6D5BD0
13	#F8EEFF	#8E44AD
14	#FDEEFF	#C0399F
15	#FFEAF4	#D63384
16	#FFF0F5	#C2185B
17	#F7F7F8	#4B5563
18	#ECEFF1	#546E7A
19	#F4F1EC	#8D6E63
20	#EEF5E8	#4CAF50
21	#E7F8F2	#00A676
22	#E7F7FF	#0077CC
23	#EEF2FD	#5B6CFF
24	#F4EDFF	#7B61FF
25	#FCEEFF	#B04CE1
26	#FFF1E8	#F97316
27	#FFF8F1	#C77D00
28	#EDF8E6	#3F8F3F
29	#EAFDF8	#0F9D8A
30	#EEF7FB	#2B7A9A
`;

const lines = paletteText.trim().split('\n');
const jsArray = lines.map(line => {
  const [id, bg, color] = line.split('\t');
  return `{ bg: "${bg.trim()}", color: "${color.trim()}" }`;
}).join(',\n  ');

console.log(`export const DEPARTMENT_COLORS = [\n  ${jsArray}\n];`);
