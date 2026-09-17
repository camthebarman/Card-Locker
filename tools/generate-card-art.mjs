/**
 * Generates the mock football card artwork used by the demo portfolio.
 *
 * The cards are drawn as SVG so the portfolio stays fully self contained:
 * no hotlinked photos, nothing to download, and they stay crisp on a phone.
 *
 * Usage: node tools/generate-card-art.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'cards');

const SKIN = '#3b2a22';

/* Thick round-capped limbs + a solid jersey read well at thumbnail size. */
const POSES = {
  throw: {
    head: [126, 78],
    shoulders: [120, 112],
    hips: [120, 192],
    legs: [[[104, 192], [84, 236], [50, 292]], [[136, 192], [158, 238], [188, 298]]],
    arms: [[[100, 118], [64, 126], [42, 152]], [[138, 112], [178, 88], [198, 52]]],
    ball: [204, 42, -35],
  },
  run: {
    head: [128, 76],
    shoulders: [120, 110],
    hips: [120, 190],
    legs: [[[104, 190], [64, 216], [36, 266]], [[136, 190], [172, 222], [152, 280]]],
    arms: [[[100, 118], [70, 142], [62, 182]], [[140, 116], [172, 132], [188, 98]]],
    ball: [58, 192, 20],
  },
  catch: {
    head: [124, 84],
    shoulders: [120, 118],
    hips: [120, 196],
    legs: [[[104, 196], [86, 246], [66, 300]], [[136, 196], [160, 242], [188, 288]]],
    arms: [[[98, 122], [72, 84], [82, 40]], [[142, 122], [170, 86], [164, 42]]],
    ball: [123, 30, 8],
  },
  defense: {
    head: [120, 86],
    shoulders: [120, 122],
    hips: [120, 198],
    legs: [[[102, 198], [72, 246], [44, 300]], [[138, 198], [170, 246], [200, 300]]],
    arms: [[[98, 128], [54, 148], [20, 170]], [[142, 128], [186, 148], [220, 168]]],
    ball: null,
  },
};

const pts = (list) => list.map(([x, y]) => `${x},${y}`).join(' ');
const limb = (points, color, width) =>
  `<polyline points="${pts(points)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

function football(x, y, angle, id) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
      <ellipse rx="27" ry="17" fill="url(#leather${id})" stroke="#2b1a12" stroke-width="2"/>
      <path d="M-13 0h26" stroke="#fdfdfd" stroke-width="3" stroke-linecap="round"/>
      <path d="M-7-5v10M0-6v12M7-5v10" stroke="#fdfdfd" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M-20-9a34 34 0 0 1 40 0M-20 9a34 34 0 0 0 40 0" fill="none" stroke="#f0e6da" stroke-width="1.6" opacity=".55"/>
    </g>`;
}

function player(card, id) {
  const p = POSES[card.pose];
  const [hx, hy] = p.head;
  const [sx, sy] = p.shoulders;
  const [px, py] = p.hips;
  const jersey = card.jersey;
  const pants = card.pants;
  const helmet = card.helmet;

  /* Figure is authored in a 240x340 box, then centred in the 460x660 art window. */
  const [fx, fy, fs] = card.figure ?? [88, 118, 1.35];
  return `<g transform="translate(${fx} ${fy}) scale(${fs})">
    <ellipse cx="${px}" cy="${Math.max(...p.legs.map((l) => l[2][1])) + 14}" rx="104" ry="15" fill="#000" opacity=".28"/>
    ${p.arms.map((a) => limb(a, SKIN, 19)).join('')}
    ${p.legs.map((l) => limb(l, pants, 25)).join('')}
    ${p.legs
      .map((l) => limb([l[1], l[2]], SKIN, 17) + `<ellipse cx="${l[2][0]}" cy="${l[2][1] + 6}" rx="16" ry="8" fill="#15171c"/>`)
      .join('')}
    ${p.arms.map((a) => limb([a[0], a[1]], jersey, 25)).join('')}
    <path d="M${sx - 46} ${sy + 4}q46-26 92 0l10 46q-56 22-112 0z" fill="${jersey}" stroke="#0d0f14" stroke-width="2.5"/>
    <path d="M${px - 34} ${py - 34}h68l4 34q-38 14-76 0z" fill="${jersey}" stroke="#0d0f14" stroke-width="2"/>
    <path d="M${px - 36} ${py - 4}h72l3 22q-39 13-78 0z" fill="${pants}" stroke="#0d0f14" stroke-width="2"/>
    <text x="${px}" y="${py - 6}" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="34" fill="${card.number_ink}" opacity=".95">${card.jerseyNo}</text>
    <g transform="translate(${hx} ${hy})">
      <path d="M2 22q-16 0-16-12" fill="none" stroke="${SKIN}" stroke-width="14" stroke-linecap="round"/>
      <path d="M-28-4a28 28 0 0 1 56 0v12q0 14-14 14h-28q-14 0-14-14z" fill="${helmet}" stroke="#0d0f14" stroke-width="2.5"/>
      <path d="M-27-6a27 26 0 0 1 54 0" fill="none" stroke="#fff" stroke-width="4" opacity=".3"/>
      <ellipse cx="-4" cy="6" rx="9" ry="10" fill="#0d0f14" opacity=".35"/>
      <path d="M26 2q10 2 11 10M13 12h22M15 21h18" fill="none" stroke="#e6eaf0" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M26 2v22" fill="none" stroke="#e6eaf0" stroke-width="3.2" stroke-linecap="round"/>
    </g>
    ${p.ball ? football(p.ball[0], p.ball[1], p.ball[2], id) : ''}
  </g>`;
}

/* Arial Black runs ~0.68em per capital, so keep long names inside the 412px plate. */
const nameSize = (name) => Math.max(21, Math.min(40, Math.round(404 / (name.length * 0.78))));

function svg(card, id) {
  const { bg1, bg2, accent, jersey } = card;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700" width="500" height="700" role="img" aria-label="${card.name} ${card.set} football card">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}"/><stop offset=".55" stop-color="${bg2}"/><stop offset="1" stop-color="${bg1}"/>
    </linearGradient>
    <linearGradient id="prizm${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff4d6d"/><stop offset=".2" stop-color="#ffd166"/><stop offset=".4" stop-color="#63f0a5"/>
      <stop offset=".6" stop-color="#4cc9f0"/><stop offset=".8" stop-color="#b57bff"/><stop offset="1" stop-color="#ff4d6d"/>
    </linearGradient>
    <linearGradient id="foil${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#e8b44a"/><stop offset=".6" stop-color="#fff8dc"/><stop offset="1" stop-color="#c98f21"/>
    </linearGradient>
    <linearGradient id="leather${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9a552c"/><stop offset="1" stop-color="#5e2d15"/>
    </linearGradient>
    <radialGradient id="glow${id}" cx=".5" cy=".38" r=".62">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots${id}" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="2" fill="#fff" opacity=".13"/>
    </pattern>
    <clipPath id="art${id}"><rect x="20" y="20" width="460" height="660" rx="20"/></clipPath>
  </defs>

  <rect width="500" height="700" rx="28" fill="#0b0d12"/>
  <rect x="8" y="8" width="484" height="684" rx="24" fill="url(#foil${id})"/>
  <rect x="14" y="14" width="472" height="672" rx="22" fill="#0b0d12"/>

  <g clip-path="url(#art${id})">
    <rect x="20" y="20" width="460" height="660" fill="url(#bg${id})"/>
    <rect x="20" y="20" width="460" height="660" fill="url(#dots${id})"/>
    <g opacity=".5">
      ${[...Array(9)].map((_, i) => `<path d="M${-180 + i * 92} 700L${40 + i * 92} 20" stroke="#fff" stroke-width="26" opacity=".05"/>`).join('')}
    </g>
    <rect x="20" y="20" width="460" height="660" fill="url(#glow${id})"/>
    <text x="250" y="430" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="330" fill="#fff" opacity=".1">${card.jerseyNo}</text>
    <text x="250" y="150" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="58" fill="#fff" opacity=".12" letter-spacing="6">${card.teamShort}</text>

    ${player(card, id)}

    <g opacity=".12"><rect x="20" y="20" width="460" height="660" fill="url(#prizm${id})"/></g>
    <path d="M20 520L480 210v96L20 616z" fill="#fff" opacity=".1"/>

    <path d="M20 560h460v120H20z" fill="#0b0d12" opacity=".82"/>
    <path d="M20 560h460" stroke="url(#foil${id})" stroke-width="4"/>
    <text x="44" y="614" font-family="Arial Black, Impact, sans-serif" font-size="${nameSize(card.name)}" fill="#fff" letter-spacing="1">${card.name.toUpperCase()}</text>
    <text x="46" y="650" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="${accent}" letter-spacing="3">${card.position} · ${card.team.toUpperCase()}</text>

    <g transform="translate(44 64)">
      <rect x="-14" y="-30" width="${card.set.length * 17 + 26}" height="44" rx="10" fill="#0b0d12" opacity=".75"/>
      <text x="0" y="2" font-family="Arial Black, Impact, sans-serif" font-size="22" fill="url(#foil${id})" letter-spacing="3">${card.set.toUpperCase()}</text>
    </g>
    <text x="456" y="66" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#fff" opacity=".75">${card.year} · #${card.cardNo}</text>
    ${
      card.badge
        ? `<g transform="translate(396 512) rotate(-6)">
             <rect x="-58" y="-24" width="116" height="48" rx="8" fill="${bg1}" stroke="url(#foil${id})" stroke-width="3"/>
             <text x="0" y="9" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="${card.badge.length > 6 ? 20 : 26}" fill="#fff" letter-spacing="2">${card.badge}</text>
           </g>`
        : ''
    }
  </g>
  <rect x="14" y="14" width="472" height="672" rx="22" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="2"/>
</svg>`;
}

/* Colour + pose recipe per card. Kept next to the art so both stay in sync. */
const CARDS = [
  { file: 'mahomes', name: 'Patrick Mahomes', team: 'Kansas City', teamShort: 'KC', position: 'QB', set: 'Prizmatic', year: 2024, cardNo: 15, jerseyNo: 15, pose: 'throw', bg1: '#8c1420', bg2: '#e01b30', accent: '#ffc843', jersey: '#c8102e', pants: '#f2f4f7', helmet: '#c8102e', number_ink: '#ffffff', badge: 'MVP' },
  { file: 'allen', name: 'Josh Allen', team: 'Buffalo', teamShort: 'BUF', position: 'QB', set: 'Velocity', year: 2023, cardNo: 17, jerseyNo: 17, pose: 'throw', bg1: '#00274c', bg2: '#0f4d92', accent: '#c60c30', jersey: '#00338d', pants: '#f2f4f7', helmet: '#00338d', number_ink: '#ffffff', badge: 'SP' },
  { file: 'jefferson', name: 'Justin Jefferson', team: 'Minnesota', teamShort: 'MIN', position: 'WR', set: 'Mosaic Blaze', year: 2023, cardNo: 18, jerseyNo: 18, pose: 'catch', bg1: '#31135e', bg2: '#5b2a9c', accent: '#ffc62f', jersey: '#4f2683', pants: '#ffc62f', helmet: '#4f2683', number_ink: '#ffc62f', badge: 'SSP' },
  { file: 'chase', name: "Ja'Marr Chase", team: 'Cincinnati', teamShort: 'CIN', position: 'WR', set: 'Apex Chrome', year: 2021, cardNo: 1, jerseyNo: 1, pose: 'catch', bg1: '#4a1c00', bg2: '#fb4f14', accent: '#ffffff', jersey: '#fb4f14', pants: '#111418', helmet: '#111418', number_ink: '#111418', badge: 'RC' },
  { file: 'mccaffrey', name: 'Christian McCaffrey', team: 'San Francisco', teamShort: 'SF', position: 'RB', set: 'Legacy Select', year: 2023, cardNo: 23, jerseyNo: 23, pose: 'run', bg1: '#5c0a17', bg2: '#aa0000', accent: '#b3995d', jersey: '#aa0000', pants: '#b3995d', helmet: '#aa0000', number_ink: '#b3995d', badge: 'SP' },
  { file: 'hurts', name: 'Jalen Hurts', team: 'Philadelphia', teamShort: 'PHI', position: 'QB', set: 'Kinetic', year: 2022, cardNo: 1, jerseyNo: 1, pose: 'run', bg1: '#00251c', bg2: '#004c54', accent: '#a5acaf', jersey: '#004c54', pants: '#e8ebee', helmet: '#004c54', number_ink: '#ffffff', badge: '/99' },
  { file: 'burrow', name: 'Joe Burrow', team: 'Cincinnati', teamShort: 'CIN', position: 'QB', set: 'Prizmatic', year: 2020, cardNo: 9, jerseyNo: 9, pose: 'throw', bg1: '#3a1500', bg2: '#fb4f14', accent: '#ffffff', jersey: '#111418', pants: '#fb4f14', helmet: '#fb4f14', number_ink: '#fb4f14', badge: 'RC' },
  { file: 'parsons', name: 'Micah Parsons', team: 'Dallas', teamShort: 'DAL', position: 'LB', set: 'Titanium', year: 2021, cardNo: 11, jerseyNo: 11, pose: 'defense', bg1: '#0b1d33', bg2: '#1f3f6b', accent: '#869397', jersey: '#f2f4f7', pants: '#0b1d33', helmet: '#8a9399', number_ink: '#002244', badge: 'RC' },
  { file: 'kelce', name: 'Travis Kelce', team: 'Kansas City', teamShort: 'KC', position: 'TE', set: 'Gridiron Royalty', year: 2022, cardNo: 87, jerseyNo: 87, pose: 'catch', bg1: '#7d1220', bg2: '#c8102e', accent: '#ffc843', jersey: '#f2f4f7', pants: '#c8102e', helmet: '#c8102e', number_ink: '#c8102e', badge: 'AUTO' },
  { file: 'hill', name: 'Tyreek Hill', team: 'Miami', teamShort: 'MIA', position: 'WR', set: 'Velocity', year: 2023, cardNo: 10, jerseyNo: 10, pose: 'run', bg1: '#00413d', bg2: '#008e97', accent: '#fc4c02', jersey: '#008e97', pants: '#f2f4f7', helmet: '#008e97', number_ink: '#fc4c02', badge: '/25' },
  { file: 'jackson', name: 'Lamar Jackson', team: 'Baltimore', teamShort: 'BAL', position: 'QB', set: 'Spectra', year: 2023, cardNo: 8, jerseyNo: 8, pose: 'run', bg1: '#180a33', bg2: '#241773', accent: '#9e7c0c', jersey: '#241773', pants: '#f2f4f7', helmet: '#241773', number_ink: '#c8b26a', badge: 'MVP' },
  { file: 'stroud', name: 'C.J. Stroud', team: 'Houston', teamShort: 'HOU', position: 'QB', set: 'Apex Chrome', year: 2023, cardNo: 7, jerseyNo: 7, pose: 'throw', bg1: '#00143c', bg2: '#03202f', accent: '#a71930', jersey: '#03202f', pants: '#f2f4f7', helmet: '#03202f', number_ink: '#ffffff', badge: 'RC' },
  { file: 'robinson', name: 'Bijan Robinson', team: 'Atlanta', teamShort: 'ATL', position: 'RB', set: 'Mosaic Blaze', year: 2023, cardNo: 7, jerseyNo: 7, pose: 'run', bg1: '#3d0008', bg2: '#a71930', accent: '#a5acaf', jersey: '#111418', pants: '#a71930', helmet: '#a71930', number_ink: '#ffffff', badge: 'RC' },
  { file: 'barkley', name: 'Saquon Barkley', team: 'Philadelphia', teamShort: 'PHI', position: 'RB', set: 'Kinetic', year: 2024, cardNo: 26, jerseyNo: 26, pose: 'run', bg1: '#00251c', bg2: '#0b6f77', accent: '#a5acaf', jersey: '#004c54', pants: '#e8ebee', helmet: '#004c54', number_ink: '#a5d8dd', badge: 'AUTO' },
  { file: 'lamb', name: 'CeeDee Lamb', team: 'Dallas', teamShort: 'DAL', position: 'WR', set: 'Spectra', year: 2022, cardNo: 88, jerseyNo: 88, pose: 'catch', bg1: '#001233', bg2: '#25476e', accent: '#869397', jersey: '#003594', pants: '#c9cdd2', helmet: '#8a9399', number_ink: '#ffffff', badge: 'SSP' },
  { file: 'williams', name: 'Caleb Williams', team: 'Chicago', teamShort: 'CHI', position: 'QB', set: 'Hall Pass', year: 2024, cardNo: 18, jerseyNo: 18, pose: 'throw', bg1: '#001b2e', bg2: '#0b263f', accent: '#e64100', jersey: '#0b162a', pants: '#e64100', helmet: '#0b162a', number_ink: '#e64100', badge: 'RC' },
  { file: 'purdy', name: 'Brock Purdy', team: 'San Francisco', teamShort: 'SF', position: 'QB', set: 'Legacy Select', year: 2022, cardNo: 13, jerseyNo: 13, pose: 'throw', bg1: '#4a0a12', bg2: '#8c1c1c', accent: '#b3995d', jersey: '#aa0000', pants: '#b3995d', helmet: '#aa0000', number_ink: '#ffffff', badge: 'RC' },
  { file: 'donald', name: 'Aaron Donald', team: 'Los Angeles', teamShort: 'LAR', position: 'DT', set: 'Titanium', year: 2021, cardNo: 99, jerseyNo: 99, pose: 'defense', bg1: '#00234d', bg2: '#003594', accent: '#ffd100', jersey: '#003594', pants: '#ffd100', helmet: '#003594', number_ink: '#ffd100', badge: 'HOF' },
  { file: 'wilson', name: 'Garrett Wilson', team: 'New York', teamShort: 'NYJ', position: 'WR', set: 'Gridiron Royalty', year: 2022, cardNo: 17, jerseyNo: 17, pose: 'catch', bg1: '#06301c', bg2: '#125740', accent: '#ffffff', jersey: '#115740', pants: '#f2f4f7', helmet: '#115740', number_ink: '#ffffff', badge: 'SP' },
  { file: 'collins', name: 'Nico Collins', team: 'Houston', teamShort: 'HOU', position: 'WR', set: 'Hall Pass', year: 2021, cardNo: 12, jerseyNo: 12, pose: 'catch', bg1: '#001a33', bg2: '#0d3c57', accent: '#a71930', jersey: '#f2f4f7', pants: '#03202f', helmet: '#03202f', number_ink: '#a71930', badge: 'RC' },
];

mkdirSync(OUT_DIR, { recursive: true });
CARDS.forEach((card, i) => {
  const id = String(i + 1).padStart(2, '0');
  writeFileSync(resolve(OUT_DIR, `${id}-${card.file}.svg`), svg(card, id));
});
console.log(`Wrote ${CARDS.length} card images to ${OUT_DIR}`);
