// @ts-nocheck
// 地図記号の絵 (国土地理院「地図記号一覧」の 134 種)。地図記号クイズ (chizu-kigou-quiz) の script.js から移したもの。
// 100 × 100 の中に、下の部品関数で組み立てる。部品は元のままなので、型の検査はしていない。
// 大きいので、図をはじめて出すときに読みこむ (ui/figure.ts)。名前や由来は data/symbols.ts にある。

// 記号の色（国土地理院の配色に合わせる。黒い記号は currentColor）
const C = {
  k: 'currentColor',
  gray: '#7a7a7a',
  blue: '#1f55a5',
  water: '#b9c8e8',
  brown: '#c19a3e',
  gravel: '#b0532c',
  orange: '#ef7c4e',
  building: '#fbe3c0',
  subway: '#c4a13f',
  expressway: '#9ed3a0',
  national: '#e39a9a',
  prefectural: '#f2ee62'
};

// SVG 部品
const svg = (...parts) => `<svg viewBox="0 0 100 100" class="symbol-svg" aria-hidden="true">${parts.join('')}</svg>`;
const ln = (d, w, c = C.k, extra = '') => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" ${extra}/>`;
const area = (d, c, extra = '') => `<path d="${d}" fill="${c}" ${extra}/>`;
const dot = (x, y, r, c = C.k) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const dots = (points, r, c = C.k) => points.map(([x, y]) => dot(x, y, r, c)).join('');
const ring = (x, y, r, w, c = C.k, f = 'none') => `<circle cx="${x}" cy="${y}" r="${r}" stroke="${c}" stroke-width="${w}" fill="${f}"/>`;
const oval = (x, y, rx, ry, w, c, extra = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" stroke="${c}" stroke-width="${w}" fill="none" ${extra}/>`;
const box = (x, y, w, h, sw, c, f = 'none', extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${c}" stroke-width="${sw}" fill="${f}" ${extra}/>`;
const bar = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const txt = (x, y, size, s, c = C.k) => `<text x="${x}" y="${y}" font-size="${size}" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle" fill="${c}">${s}</text>`;
const dash = (a, b) => `stroke-dasharray="${a} ${b}"`;
const range = (from, to, step) => {
  const out = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 10) / 10);
  return out;
};

// 四角形の中の斜線（dir: 1 = ＼ / -1 = ／）
const hatchRect = (x0, y0, x1, y1, step, dir) => {
  const d = [];
  if (dir > 0) {
    for (let c = y0 - x1 + step; c < y1 - x0; c += step) {
      const xa = Math.max(x0, y0 - c), xb = Math.min(x1, y1 - c);
      d.push(`M${xa},${xa + c} L${xb},${xb + c}`);
    }
  } else {
    for (let c = x0 + y0 + step; c < x1 + y1; c += step) {
      const xa = Math.max(x0, c - y1), xb = Math.min(x1, c - y0);
      d.push(`M${xa},${c - xa} L${xb},${c - xb}`);
    }
  }
  return d.join(' ');
};

// 円の中の斜線（＼）
const hatchCircle = (cx, cy, r, step) => {
  const d = [];
  for (let t = -r + step; t < r; t += step) {
    const h = Math.sqrt(r * r - t * t) / Math.SQRT2;
    const mx = cx + t / Math.SQRT2, my = cy - t / Math.SQRT2;
    d.push(`M${(mx - h).toFixed(1)},${(my - h).toFixed(1)} L${(mx + h).toFixed(1)},${(my + h).toFixed(1)}`);
  }
  return d.join(' ');
};

// 道路（2本線）・JR線（旗竿）・私鉄などの共通パーツ
const road2 = (gap, w, extra = '') => ln(`M0,${50 - gap / 2} L100,${50 - gap / 2} M0,${50 + gap / 2} L100,${50 + gap / 2}`, w, C.gray, extra);
const colorRoad = (fillColor) => bar(0, 36, 100, 28, fillColor) + ln('M0,36 L100,36 M0,64 L100,64', 4.5, C.gray);
const jrBar = (whites, y = 44, h = 12) => bar(0, y, 100, h, C.gray) + whites.map(([a, b]) => bar(a, y + 2.5, b - a, h - 5, '#ffffff')).join('');
const JR_SINGLE = [[16, 40], [60, 84]];
const JR_DOUBLE = [[13, 25], [28, 40], [60, 72], [75, 87]];
const ticks = (xs, half, w, y = 50) => ln(xs.map(x => `M${x},${y - half} L${x},${y + half}`).join(' '), w, C.gray);
const mouthR = (x, c = C.gray, w = 4.5) => ln(`M${x},36 Q${x + 9},50 ${x},64`, w, c); // ）
const mouthL = (x, c = C.gray, w = 4.5) => ln(`M${x},36 Q${x - 9},50 ${x},64`, w, c); // （
const snowShed = ln('M28,41 L72,41 M28,59 L72,59', 3, C.gray)
  + ln('M30,59 L38,41 M40,59 L48,41 M50,59 L58,41 M60,59 L68,41', 5, C.gray);

// 等高線・等深線（色ちがいで同じ形）
const contourMain = (c) => oval(50, 50, 42, 27, 2.5, c) + oval(48, 51, 27, 16, 2.5, c) + oval(46, 52, 12, 6, 2.5, c);
const contourIndex = (c) => ln('M12,54 C10,36 30,30 50,28 C72,24 92,30 88,46 C86,60 74,58 66,64 C50,76 16,74 12,54 Z', 7, c);
const contourSub = (c) => ln('M12,54 C10,36 30,30 50,28 C72,24 92,30 88,46 C86,60 74,58 66,64 C50,76 16,74 12,54 Z', 3, c, dash(11, 7));
const hollowSmall = (c) => oval(44, 50, 20, 11, 3, c)
  + ln('M82,16 L50,46', 3.5, c) + area('M44,52 L60,47 L52,38 Z', c)
  + ln('M8,50 Q40,92 92,58', 3, c);
const cliffRock = (c) => ln(range(8, 76, 17).map(x =>
  `M${x},74 L${x},48 L${x + 8.5},37 L${x + 17},48 M${x},57 L${x + 8},53 M${x},68 L${x + 8},64`).join(' ') + ' M93,48 L93,74', 3, c, 'stroke-linejoin="round"');
const cliffComb = (c) => ln('M6,42 L94,42 ' + range(8, 92, 7).map(x => `M${x},42 L${x},58`).join(' '), 3, c);

// 建物記号の共通パーツ
const crossX = (w) => ln('M25,25 L75,75 M75,25 L25,75', w);
const bun = (w) => ln('M50,26 L50,35 M27,38 L73,38 M60,46 C49,60 38,67 27,73 M39,47 C48,58 59,67 73,73', w, C.k, 'stroke-linecap="round"');
const anchor = ln('M50,24 L50,86', 6) + ln('M18,62 Q50,108 82,62', 6) + ln('M13,74 L18,60 L30,66 M87,74 L82,60 L70,66', 5);
const stone = (inner) => ln('M40,78 L40,36 A10,10 0 0 1 60,36 L60,78 M36,78 L76,78', 6) + inner;
const bamboo = (foot) => ln(`M20,44 L40,24 M60,24 L80,44 M50,32 L50,80${foot ? ' L80,80' : ''}`, 6.5);

const CAT = {
  base: '基準点',
  water: '河川・湖沼・海',
  road: '道路',
  rail: '鉄道',
  building: '建物',
  structure: '構造物',
  vegetation: '植生',
  special: '特定地区',
  land: '陸部の地形',
  lake: '水部の地形',
  border: '行政界'
};

// lookalike: 形がほぼ同じ（線の間隔や点の大きさだけが違う）記号のグループ。
// 同じグループの記号は、互いの選択肢に出さない。
const SYMBOL_DATA = [
  // ---------- 基準点 ----------
  {
    id: 'gnss_station',
    svg: svg(ln('M40,46 L14,90 L66,90 Z', 5.5), dot(40, 76, 4.5), ln('M40,46 L40,10 L52,24 L62,12 L72,24 L84,10', 5))
  },
  {
    id: 'triangulation_point',
    svg: svg(ln('M50,20 L20,76 L80,76 Z', 6), dot(50, 58, 4.5))
  },
  {
    id: 'benchmark',
    svg: svg(box(24, 24, 52, 52, 6, C.k), dot(50, 50, 4.5))
  },
  {
    id: 'spot_height',
    svg: svg(dot(12, 33, 4.5), txt(57, 42, 25, '124.7'), dot(26, 68, 4.5), txt(62, 77, 25, '138'))
  },
  {
    id: 'water_level',
    svg: svg(ln('M4,50 L20,50 M80,50 L96,50', 4), txt(50, 61, 30, '156'))
  },
  {
    id: 'water_depth',
    svg: svg(dot(16, 50, 5, C.blue), txt(60, 61, 30, '217', C.blue))
  },

  // ---------- 河川・湖沼・海 ----------
  {
    id: 'river_single',
    svg: svg(ln('M-2,28 C24,22 30,46 50,50 S74,70 102,74', 5, C.blue))
  },
  {
    id: 'river_double',
    svg: svg(`<path d="M-4,26 C28,20 36,42 56,46 S82,58 104,56 L104,78 C78,82 60,68 48,64 S24,46 -4,46 Z" fill="${C.water}" stroke="${C.blue}" stroke-width="3.5"/>`)
  },
  {
    id: 'underground_waterway',
    svg: svg(ln('M0,50 L26,50 M74,50 L100,50', 4.5, C.blue), mouthR(30), mouthL(70), ln('M42,50 L60,50', 4.5, C.blue, dash(7, 5)))
  },
  {
    id: 'elevated_waterway',
    svg: svg(ln('M0,50 L26,50 M74,50 L100,50', 4.5, C.blue), box(26, 44, 48, 12, 3, C.gray, '#ffffff'))
  },
  {
    id: 'dry_river',
    svg: svg(
      ln('M0,50 L26,50 M74,50 L100,50', 4.5, C.blue), ln('M30,50 L72,50', 4.5, C.blue, dash(9, 6)),
      dots([].concat(...[34, 40, 60, 66].map((y, i) => range(i % 2 ? 31 : 28, 72, 6).map(x => [x, y]))), 1.5, C.gravel)
    )
  },
  {
    id: 'coastline',
    svg: svg(area('M0,44 C18,28 30,56 52,46 S82,30 100,44 L100,100 L0,100 Z', C.water), ln('M0,44 C18,28 30,56 52,46 S82,30 100,44', 4.5, C.blue))
  },
  {
    id: 'flow_direction',
    svg: svg(
      `<path d="M32,-4 C26,30 44,60 28,104 L64,104 C74,60 58,30 70,-4 Z" fill="${C.water}" stroke="${C.blue}" stroke-width="3.5"/>`,
      ln('M55,22 L48,66', 5, C.gray), area('M45,80 L37,61 L57,64 Z', C.gray)
    )
  },
  {
    id: 'ferry_route',
    svg: svg(bar(0, 14, 100, 72, C.water), ln('M0,14 L0,86', 7, C.blue),
      `<path d="M10,42 L22,42 A8,8 0 0 1 22,58 L10,58 Z" fill="#ffffff" stroke="${C.gray}" stroke-width="3.5"/>`,
      ln('M40,50 L100,50', 4.5, C.gray, dash(11, 8)))
  },

  // ---------- 道路 ----------
  {
    id: 'road_2lane_sidewalk',
    svg: svg(road2(20, 3))
  },
  {
    id: 'road_2lane',
    svg: svg(road2(13, 3))
  },
  {
    id: 'road_1lane',
    svg: svg(road2(7, 3))
  },
  {
    id: 'light_road',
    svg: svg(ln('M0,50 L100,50', 5, C.gray))
  },
  {
    id: 'footpath',
    svg: svg(ln('M4,50 L100,50', 5, C.gray, dash(17, 8)))
  },
  {
    id: 'toll_road',
    svg: svg(road2(22, 4.5), dots([[14, 50], [38, 50], [62, 50], [86, 50]], 4.5, C.gray))
  },
  {
    id: 'median_strip',
    svg: svg(road2(26, 4.5), ln('M6,50 L42,50 M58,50 L96,50', 2.5, C.gray))
  },
  {
    id: 'road_snow_shed',
    svg: svg(ln('M0,41 L28,41 M0,59 L28,59 M72,41 L100,41 M72,59 L100,59', 3, C.gray), snowShed)
  },
  {
    id: 'garden_path',
    svg: svg(road2(13, 3, dash(12, 6)))
  },
  {
    id: 'stone_steps',
    svg: svg(road2(16, 3), ln(range(5, 95, 6).map(x => `M${x},42 L${x},58`).join(' '), 2.5, C.gray))
  },
  {
    id: 'national_route_number',
    svg: svg(area('M50,92 C30,80 10,62 10,34 C10,20 20,12 34,12 L66,12 C80,12 90,20 90,34 C90,62 70,80 50,92 Z', '#2b5fb0'), txt(50, 55, 30, '408', '#ffffff'))
  },
  {
    id: 'expressway',
    svg: svg(colorRoad(C.expressway))
  },
  {
    id: 'national_road',
    svg: svg(colorRoad(C.national))
  },
  {
    id: 'prefectural_road',
    svg: svg(colorRoad(C.prefectural))
  },
  {
    id: 'road_bridge',
    svg: svg(road2(16, 3), ln('M16,30 L24,42 M16,70 L24,58 M84,30 L76,42 M84,70 L76,58', 3, C.gray))
  },
  {
    id: 'road_tunnel',
    svg: svg(ln('M0,43 L24,43 M0,57 L24,57 M76,43 L100,43 M76,57 L100,57', 4, C.gray), mouthR(28), mouthL(72),
      ln('M40,43 L62,43 M40,57 L62,57', 4, C.gray, dash(8, 6)))
  },
  {
    id: 'true_width_road',
    svg: svg(road2(38, 4.5))
  },

  // ---------- 鉄道 ----------
  {
    id: 'jr_double',
    svg: svg(jrBar(JR_DOUBLE))
  },
  {
    id: 'jr_single',
    svg: svg(jrBar(JR_SINGLE))
  },
  {
    id: 'private_rail_double',
    svg: svg(ln('M0,50 L100,50', 5, C.gray), ticks([17, 23, 47, 53, 77, 83], 9, 3))
  },
  {
    id: 'private_rail_single',
    svg: svg(ln('M0,50 L100,50', 5, C.gray), ticks([20, 50, 80], 9, 3))
  },
  {
    id: 'subway',
    svg: svg(ln('M2,50 L66,50', 7, C.subway, dash(13, 9)), mouthL(78), ln('M80,50 L100,50', 5, C.gray), ticks([90], 9, 3))
  },
  {
    id: 'tram',
    svg: svg(ln('M0,38 L100,38 M0,62 L100,62', 2.5, C.gray), ln('M0,50 L100,50', 5, C.gray))
  },
  {
    id: 'special_rail',
    svg: svg(ln('M0,50 L100,50', 2.5, C.gray), ticks([14, 32, 50, 68, 86], 9, 2.5))
  },
  {
    id: 'cableway',
    svg: svg(ln('M0,50 L100,50', 2.5, C.gray), area('M14,50 L21,41 L28,50 Z M43,50 L50,59 L57,50 Z M72,50 L79,41 L86,50 Z', C.gray))
  },
  {
    id: 'station_jr',
    svg: svg(jrBar([[8, 24], [76, 92]]), box(28, 39, 44, 22, 3.5, C.gray, '#ffffff'))
  },
  {
    id: 'station_private',
    svg: svg(ln('M0,50 L100,50', 5, C.gray), ticks([14, 86], 9, 3), box(28, 39, 44, 22, 3.5, C.gray, '#ffffff'))
  },
  {
    id: 'siding',
    svg: svg(jrBar([[18, 40], [58, 80]], 22, 12), ln('M26,34 L40,58 Q45,68 56,68 L100,68 M34,50 L100,50', 2.5, C.gray))
  },
  {
    id: 'jr_under_construction',
    svg: svg(ln('M0,44 L100,44 M0,56 L100,56', 2.5, C.gray), ticks([20, 50, 80], 6, 2.5))
  },
  {
    id: 'private_rail_under_construction',
    svg: svg(ln('M4,50 L30,50 M38,50 L64,50 M72,50 L98,50', 5, C.gray), ticks([17, 51, 85], 9, 3))
  },
  {
    id: 'rail_bridge',
    svg: svg(jrBar([[30, 52]]), ln('M24,35 L84,35 M24,65 L84,65', 2.5, C.gray), dots([[30, 35], [78, 35], [30, 65], [78, 65]], 4, C.gray))
  },
  {
    id: 'rail_tunnel',
    svg: svg(bar(0, 44, 24, 12, C.gray), bar(76, 44, 24, 12, C.gray), mouthR(28), mouthL(72), ln('M40,50 L62,50', 7, C.subway, dash(8, 6)))
  },
  {
    id: 'rail_snow_shed',
    svg: svg(bar(0, 44, 28, 12, C.gray), bar(72, 44, 28, 12, C.gray), snowShed)
  },
  {
    id: 'station_special',
    svg: svg(ln('M0,50 L100,50', 2.5, C.gray), ticks([8, 20, 80, 92], 8, 2.5), box(32, 42, 36, 16, 3, C.gray, '#ffffff'))
  },
  {
    id: 'station_subway',
    svg: svg(ln('M0,50 L10,50 M18,50 L30,50 M70,50 L82,50 M90,50 L100,50', 7, C.subway), box(30, 39, 40, 22, 3.5, C.subway, 'none', dash(9, 5)))
  },

  // ---------- 建物 ----------
  {
    id: 'building_normal',
    svg: svg(box(18, 28, 64, 44, 3, C.orange, C.building))
  },
  {
    id: 'building_solid',
    svg: svg(ln(hatchRect(18, 28, 82, 72, 11, 1), 2, C.orange), box(18, 28, 64, 44, 4.5, C.orange))
  },
  {
    id: 'building_highrise',
    svg: svg(ln(hatchRect(18, 28, 82, 72, 11, 1) + ' ' + hatchRect(18, 28, 82, 72, 11, -1), 2, C.orange), box(18, 28, 64, 44, 4.5, C.orange))
  },
  {
    id: 'building_open',
    svg: svg(ln(hatchRect(18, 28, 82, 72, 11, 1), 2, C.orange), box(18, 28, 64, 44, 3, C.orange, 'none', dash(9, 5)))
  },
  {
    id: 'government_office',
    svg: svg(ring(50, 64, 17, 7), ln('M50,47 L50,14', 7), dots([[34, 24], [66, 24]], 5.5))
  },
  {
    id: 'court',
    svg: svg(ln('M50,16 L27,56 L73,56 Z', 8), ln('M50,56 L50,88', 8))
  },
  {
    id: 'tax_office',
    svg: svg(ln('M50,32 L84,50 L50,68 L16,50 Z', 8), ln('M50,12 L50,32 M50,68 L50,88', 8))
  },
  {
    id: 'fire_station',
    svg: svg(ln('M24,16 C24,40 34,54 50,54 C66,54 76,40 76,16 M50,54 L50,88', 8))
  },
  {
    id: 'health_center',
    svg: svg(ring(50, 50, 36, 6), ln('M50,28 L50,72 M28,50 L72,50', 8))
  },
  {
    id: 'police_station',
    svg: svg(ring(50, 50, 36, 7), crossX(7))
  },
  {
    id: 'koban',
    svg: svg(ln('M30,18 L70,82 M70,18 L30,82', 8))
  },
  {
    id: 'post_office',
    svg: svg(ring(50, 50, 36, 7), ln('M17,38 L83,38 M15,53 L85,53 M50,53 L50,85', 7))
  },
  {
    id: 'school_elem_junior',
    svg: svg(ln('M50,20 L50,32 M22,35 L78,35 M64,44 C50,62 36,72 22,80 M36,46 C48,60 62,72 78,80', 7, C.k, 'stroke-linecap="round"'))
  },
  {
    id: 'high_school',
    svg: svg(ring(50, 50, 40, 5), bun(5.5))
  },
  {
    id: 'hospital',
    svg: svg(ln('M24,22 L76,22 L76,56 L50,80 L24,56 Z', 6), ln('M50,32 L50,62 M35,47 L65,47', 8))
  },
  {
    id: 'museum',
    svg: svg(ln('M14,42 L50,20 L86,42', 6), ln('M16,45 L84,45 M16,79 L84,79', 7), ln('M23,45 L23,79 M41,45 L41,79 M59,45 L59,79 M77,45 L77,79', 6))
  },
  {
    id: 'library',
    svg: svg(ln('M50,70 C40,62 26,62 18,66 L18,32 C26,28 40,28 50,36 C60,28 74,28 82,32 L82,66 C74,62 60,62 50,70 Z M50,36 L50,70', 5.5, C.k, 'stroke-linejoin="round"'))
  },
  {
    id: 'nursing_home',
    svg: svg(ln('M12,48 L50,18 L88,48', 6), ln('M22,42 L22,80 M78,42 L78,80 M14,81 L86,81', 6), ln('M41,56 C41,42 59,42 59,56 L59,80', 6))
  },
  {
    id: 'shrine',
    svg: svg(ln('M18,26 L82,26 M32,44 L68,44 M32,26 L32,82 M68,26 L68,82', 7))
  },
  {
    id: 'temple',
    svg: svg(ln('M20,22 L50,22 L50,78 L80,78 M20,78 L20,50 L80,50 L80,22', 7, C.k, 'stroke-linecap="square"'))
  },
  {
    id: 'indicator_point',
    svg: svg(dot(50, 50, 7))
  },
  {
    id: 'city_hall',
    svg: svg(ring(50, 50, 38, 8), ring(50, 50, 22, 4))
  },
  {
    id: 'town_hall',
    svg: svg(ring(50, 50, 34, 7))
  },

  // ---------- 構造物 ----------
  {
    id: 'high_tower',
    svg: svg(box(30, 30, 40, 40, 6, C.gray), ln('M30,30 L18,18 M70,30 L82,18 M30,70 L18,82 M70,70 L82,82', 6, C.gray))
  },
  {
    id: 'monument',
    svg: svg(stone(''))
  },
  {
    id: 'disaster_monument',
    svg: svg(ln('M32,82 L32,38 A18,18 0 0 1 68,38 L68,82 M24,82 L84,82', 8), ln('M50,42 L50,70', 4.5))
  },
  {
    id: 'chimney',
    svg: svg(ln('M34,90 L34,46 L54,46 L54,90 M30,90 L72,90', 6), ln('M44,35 L62,35 M54,24 L72,24 M64,13 L84,13', 5.5))
  },
  {
    id: 'windmill',
    svg: svg(ring(50, 40, 9, 5.5), ln('M47,31.5 L40,8 M58.5,43 L82,50 M43.5,46.5 L26,66', 5.5), ln('M50,49 L50,88 M34,88 L66,88', 5.5))
  },
  {
    id: 'oil_gas_well',
    svg: svg(ln('M34,16 L34,84 M66,16 L66,84 M16,34 L84,34 M16,66 L84,66', 7))
  },
  {
    id: 'lighthouse',
    svg: svg(ring(50, 50, 17, 5.5), dot(50, 50, 6.5),
      ln('M50,33 L50,12 M50,67 L50,88 M33,50 L12,50 M67,50 L88,50 M38,38 L27,27 M62,62 L73,73 M38,62 L27,73 M62,38 L73,27', 5.5))
  },
  {
    id: 'tank',
    svg: svg(ln(hatchCircle(50, 50, 32, 11), 2.5, C.orange), ring(50, 50, 32, 3, C.orange))
  },
  {
    id: 'pithead',
    svg: svg(ln('M22,64 Q50,24 78,64', 9, C.gray))
  },
  {
    id: 'water_gate',
    svg: svg(ln('M22,50 L78,50', 4.5, C.gray), dots([[20, 50], [80, 50]], 7.5, C.gray))
  },
  {
    id: 'radio_tower',
    svg: svg(ring(34, 76, 11, 5.5), ln('M34,65 L34,14 L50,32 L60,20 L70,32 L84,16', 5.5))
  },
  {
    id: 'breakwater',
    svg: svg(bar(0, 10, 100, 80, C.water), ln('M10,36 L48,64 L90,32', 15, C.gray, 'stroke-linejoin="miter"'), ln('M12,37.5 L48,64 L88,33.5', 9, '#ffffff', 'stroke-linejoin="miter"'))
  },
  {
    id: 'dam',
    svg: svg(`<path d="M-2,50 C26,50 30,22 72,20 L72,80 C30,78 26,50 -2,50 Z" fill="${C.water}" stroke="${C.blue}" stroke-width="3.5"/>`, box(74, 16, 13, 68, 3.5, C.gray, '#dddddd'))
  },
  {
    id: 'weir',
    svg: svg(ln('M8,42 L100,42', 4, C.gray, dash(15, 8)), ln('M8,56 L92,56', 5.5, C.gray))
  },
  {
    id: 'groyne',
    svg: svg(dots([].concat(range(20, 80, 12).map(x => [x, 36]), range(26, 74, 12).map(x => [x, 50]), range(20, 80, 12).map(x => [x, 64])), 4.2, C.gray))
  },
  {
    id: 'power_plant',
    svg: svg(ring(50, 50, 16, 7), ln('M50,34 L50,16 M50,66 L50,84 M38.5,38.5 L26,26 M61.5,61.5 L74,74 M38.5,61.5 L26,74 M61.5,38.5 L74,26', 7),
      ln('M34,50 L10,50 L10,86 M66,50 L90,50 L90,14', 7))
  },

  // ---------- 植生 ----------
  {
    id: 'paddy_field',
    svg: svg(ln('M39,28 L39,72 M61,28 L61,72', 6.5, C.blue))
  },
  {
    id: 'field',
    svg: svg(ln('M26,36 L50,62 L74,36', 6.5))
  },
  {
    id: 'tea_plantation',
    svg: svg(dots([[50, 36], [34, 62], [66, 62]], 5.5))
  },
  {
    id: 'orchard',
    svg: svg(ring(50, 62, 18, 6), ln('M50,44 L50,18', 6))
  },
  {
    id: 'broadleaf_forest',
    svg: svg(ring(44, 46, 18, 6.5), ln('M44,64 L80,64', 6.5))
  },
  {
    id: 'coniferous_forest',
    svg: svg(ln('M36,80 L49,18 L59,80 L82,80', 6.5, C.k, 'stroke-miterlimit="10"'))
  },
  {
    id: 'bamboo_grove',
    svg: svg(bamboo(true))
  },
  {
    id: 'palm_forest',
    svg: svg(ln('M50,32 L50,84 L76,84', 7), ln('M20,42 Q28,22 50,32 Q72,22 80,42', 7))
  },
  {
    id: 'creeping_pine',
    svg: svg(ln('M50,16 L50,78 M24,50 L50,78 L76,50', 6.5))
  },
  {
    id: 'bamboo_grass',
    svg: svg(bamboo(false))
  },
  {
    id: 'wasteland',
    svg: svg(ln('M50,20 L50,78 M29,48 L29,78 M71,48 L71,78', 6.5))
  },

  // ---------- 特定地区 ----------
  {
    id: 'special_area_boundary',
    svg: svg(ln('M4,50 L100,50', 2.5, C.gray, dash(17, 8)))
  },
  {
    id: 'cemetery',
    svg: svg(ln('M50,24 L50,74 M26,74 L74,74', 8))
  },
  {
    id: 'hot_spring',
    svg: svg(ln('M30,61 A32,13 0 1 0 70,61', 5.5, C.k, 'stroke-linecap="round"'),
      ln('M50,68 q-7,-12 0,-24 q7,-12 0,-24 M37,66 q-6,-10 0,-20 q6,-10 0,-20 M63,66 q-6,-10 0,-20 q6,-10 0,-20', 5, C.k, 'stroke-linecap="round"'))
  },
  {
    id: 'crater',
    svg: svg(ln('M21,68 A30,14 0 1 0 75,68', 6), ln('M34,78 L62,78 M34,66 L62,66 M40,54 L70,54 M46,42 L76,42 M54,30 L86,30', 6))
  },
  {
    id: 'mine',
    svg: svg(ln('M26,86 L70,26 M74,86 L30,26', 7), ln('M56,14 L84,36 M44,14 L16,36', 11))
  },
  {
    id: 'castle_ruins',
    svg: svg(ln('M22,84 L22,42 L36,42 L36,22 L64,22 L64,42 L78,42 L78,84', 6))
  },
  {
    id: 'historic_site',
    svg: svg(dots([[50, 27], [25, 70], [75, 70]], 11))
  },
  {
    id: 'port',
    svg: svg(anchor, ring(50, 16, 7.5, 5), ln('M34,38 L66,38', 6))
  },
  {
    id: 'fishing_port',
    svg: svg(anchor, dot(50, 18, 10))
  },

  // ---------- 陸部の地形 ----------
  {
    id: 'contour_main',
    svg: svg(contourMain(C.brown))
  },
  {
    id: 'contour_index',
    svg: svg(contourIndex(C.brown))
  },
  {
    id: 'contour_sub',
    svg: svg(contourSub(C.brown))
  },
  {
    id: 'hollow_large',
    svg: svg(oval(50, 50, 40, 26, 3, C.brown),
      ln(range(0, 330, 30).map(a => {
        const r = a * Math.PI / 180, x = 50 + 40 * Math.cos(r), y = 50 + 26 * Math.sin(r);
        return `M${x.toFixed(1)},${y.toFixed(1)} L${(x - 9 * Math.cos(r)).toFixed(1)},${(y - 9 * Math.sin(r)).toFixed(1)}`;
      }).join(' '), 3, C.brown))
  },
  {
    id: 'hollow_small',
    svg: svg(hollowSmall(C.brown))
  },
  {
    id: 'gully',
    svg: svg(ln('M6,34 Q34,26 54,50 Q70,30 96,36 M6,50 Q32,42 52,66 Q70,46 96,52 M6,66 Q30,58 50,82 Q70,62 96,68', 2, C.brown),
      ln('M58,18 L52,66', 5, C.brown), dot(50, 80, 4.5, C.brown))
  },
  {
    id: 'rock_cliff',
    svg: svg(cliffRock(C.brown))
  },
  {
    id: 'rock_large',
    svg: svg(ln('M22,58 C10,54 12,40 24,40 C22,28 38,24 44,32 C50,20 68,22 68,34 C82,28 92,42 82,50 C94,58 84,72 72,68 C68,80 50,80 46,70 C36,78 20,72 22,58 Z', 3, C.brown),
      ln('M28,52 q5,-7 11,-1 M52,36 q9,0 9,8 M62,60 q-9,6 -15,-1', 3, C.brown))
  },
  {
    id: 'rock_small',
    svg: svg(oval(36, 36, 16, 7, 3, C.brown), oval(72, 42, 10, 5, 3, C.brown), oval(42, 66, 11, 5.5, 3, C.brown), oval(74, 64, 8, 4.5, 3, C.brown))
  },
  {
    id: 'gravel',
    svg: svg(dots([[14, 40], [26, 30], [38, 44], [50, 28], [62, 40], [76, 30], [88, 44], [20, 56], [44, 60], [68, 56], [84, 64], [32, 70], [56, 72]], 2.2, C.brown),
      dots([[30, 52], [58, 50], [74, 44], [16, 68], [90, 54], [46, 40]], 4, C.brown))
  },
  {
    id: 'marsh',
    svg: svg(ln('M20,28 L64,28 M10,38 L44,38 M50,38 L92,38 M24,48 L84,48 M8,58 L36,58 M44,58 L80,58 M18,68 L62,68 M30,78 L74,78', 3, C.blue))
  },
  {
    id: 'perpetual_snow',
    svg: svg(dots([[30, 28], [44, 22], [58, 28], [72, 24], [18, 40], [32, 42], [46, 36], [60, 42], [74, 38], [86, 44], [14, 54], [28, 56], [42, 52], [56, 56], [70, 52], [84, 58], [24, 68], [38, 66], [52, 70], [66, 66], [78, 70], [46, 80], [60, 78]], 2.8, C.blue))
  },
  {
    id: 'waterfall',
    svg: svg(ln('M50,4 L50,56 Q56,74 38,96', 5, C.blue), ln('M32,32 L68,32', 6, C.gray), dots([[40, 46], [60, 46]], 5, C.gray))
  },
  {
    id: 'earth_cliff',
    svg: svg(cliffComb(C.brown))
  },

  // ---------- 水部の地形 ----------
  {
    id: 'depth_main',
    svg: svg(contourMain(C.blue))
  },
  {
    id: 'depth_index',
    svg: svg(contourIndex(C.blue))
  },
  {
    id: 'depth_sub',
    svg: svg(contourSub(C.blue))
  },
  {
    id: 'lake_hollow',
    svg: svg(hollowSmall(C.blue))
  },
  {
    id: 'lake_slope_large',
    svg: svg(cliffRock(C.blue))
  },
  {
    id: 'lake_slope_small',
    svg: svg(cliffComb(C.blue))
  },
  {
    id: 'tidal_flat',
    svg: svg(area('M0,36 Q50,24 100,36 L100,100 L0,100 Z', C.water), ln('M0,36 Q50,24 100,36', 3.5, C.blue),
      ln('M0,64 Q50,52 100,64', 3, C.blue, dash(11, 6)),
      dots([[8, 44], [20, 50], [32, 40], [44, 46], [56, 38], [68, 46], [80, 42], [92, 50], [14, 56], [38, 52], [62, 52], [86, 56], [50, 44], [26, 44], [74, 52]], 1.8, C.gravel))
  },
  {
    id: 'tidal_rock',
    svg: svg(bar(0, 8, 100, 84, C.water),
      ln('M22,58 C10,54 12,40 24,40 C22,28 38,24 44,32 C50,20 68,22 68,34 C82,28 92,42 82,50 C94,58 84,72 72,68 C68,80 50,80 46,70 C36,78 20,72 22,58 Z', 3.5, C.brown, dash(8, 4)))
  },

  // ---------- 行政界 ----------
  {
    id: 'prefecture_border',
    svg: svg(dots([[8, 50], [56, 50]], 4.5, C.gray), ln('M24,50 L46,50 M72,50 L100,50', 5, C.gray), ln('M17,42 L24,50 L17,58 M65,42 L72,50 L65,58', 3, C.gray))
  },
  {
    id: 'hokkaido_subprefecture_border',
    svg: svg(ln('M0,50 L26,50 M74,50 L100,50', 5, C.gray), dots([[38, 50], [50, 50], [62, 50]], 4.5, C.gray))
  },
  {
    id: 'municipality_border',
    svg: svg(ln('M0,50 L30,50 M70,50 L100,50', 4, C.gray), dots([[43, 50], [57, 50]], 4, C.gray))
  },
  {
    id: 'affiliation_border',
    svg: svg(ln('M4,50 L20,50 M54,50 L70,50', 4, C.gray), dots([[28, 50], [78, 50]], 4, C.gray))
  }
];

/** 記号の id → SVG */
export const SYMBOL_SVG: Record<string, string> = Object.fromEntries(SYMBOL_DATA.map((s) => [s.id, s.svg]));
