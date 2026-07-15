/**
 * Teaching IR / Raman peak libraries (wavenumber cm⁻¹).
 * Multi-Gaussian envelopes for education — not raw instrument files.
 */

/** @typedef {{ w: number, h: number, s: number, label?: string }} Peak */

/** @type {Record<string, Peak[]>} */
export const IR_PROFILES = {
  water: [
    { w: 3400, h: 100, s: 120, label: 'O–H stretch' },
    { w: 1640, h: 55, s: 30, label: 'H–O–H bend' },
  ],
  alcohol: [
    { w: 3330, h: 90, s: 90, label: 'O–H' },
    { w: 2940, h: 70, s: 40, label: 'C–H' },
    { w: 1450, h: 40, s: 25 },
    { w: 1050, h: 65, s: 30, label: 'C–O' },
  ],
  ketone: [
    { w: 2920, h: 50, s: 40, label: 'C–H' },
    { w: 1715, h: 100, s: 18, label: 'C=O' },
    { w: 1420, h: 35, s: 25 },
    { w: 1220, h: 40, s: 30 },
  ],
  carboxylic: [
    { w: 3000, h: 80, s: 140, label: 'O–H broad' },
    { w: 1710, h: 100, s: 20, label: 'C=O' },
    { w: 1410, h: 40, s: 25 },
    { w: 1280, h: 45, s: 30 },
  ],
  aromatic: [
    { w: 3030, h: 45, s: 25, label: 'Ar C–H' },
    { w: 1600, h: 55, s: 15, label: 'C=C ring' },
    { w: 1490, h: 50, s: 15 },
    { w: 1450, h: 40, s: 15 },
    { w: 750, h: 70, s: 20, label: 'out-of-plane' },
    { w: 690, h: 60, s: 18 },
  ],
  amine: [
    { w: 3380, h: 70, s: 50, label: 'N–H' },
    { w: 2920, h: 55, s: 40 },
    { w: 1620, h: 50, s: 25, label: 'N–H bend' },
    { w: 1280, h: 40, s: 30 },
  ],
  amide: [
    { w: 3300, h: 75, s: 50, label: 'N–H' },
    { w: 1650, h: 100, s: 20, label: 'amide I' },
    { w: 1550, h: 70, s: 20, label: 'amide II' },
    { w: 1250, h: 40, s: 25 },
  ],
  ester: [
    { w: 2950, h: 45, s: 40 },
    { w: 1740, h: 100, s: 16, label: 'C=O ester' },
    { w: 1240, h: 70, s: 30, label: 'C–O' },
    { w: 1050, h: 55, s: 25 },
  ],
  ether: [
    { w: 2930, h: 55, s: 40 },
    { w: 1120, h: 100, s: 35, label: 'C–O–C' },
  ],
  alkane: [
    { w: 2960, h: 90, s: 35, label: 'C–H' },
    { w: 2870, h: 70, s: 30 },
    { w: 1465, h: 55, s: 20 },
    { w: 1375, h: 40, s: 15 },
  ],
  nitrile: [
    { w: 2940, h: 45, s: 40 },
    { w: 2250, h: 80, s: 12, label: 'C≡N' },
    { w: 1450, h: 35, s: 25 },
  ],
  nitro: [
    { w: 1530, h: 100, s: 20, label: 'NO₂ asym' },
    { w: 1350, h: 90, s: 18, label: 'NO₂ sym' },
    { w: 850, h: 50, s: 20 },
  ],
  phenol: [
    { w: 3350, h: 85, s: 80, label: 'O–H' },
    { w: 3030, h: 40, s: 25 },
    { w: 1600, h: 50, s: 15 },
    { w: 1230, h: 70, s: 25, label: 'C–O' },
    { w: 750, h: 55, s: 20 },
  ],
  dye: [
    { w: 3400, h: 40, s: 60 },
    { w: 2920, h: 35, s: 40 },
    { w: 1600, h: 80, s: 18, label: 'aromatic' },
    { w: 1500, h: 70, s: 15 },
    { w: 1250, h: 55, s: 30 },
    { w: 820, h: 50, s: 20 },
  ],
  sugar: [
    { w: 3400, h: 100, s: 100, label: 'O–H' },
    { w: 2920, h: 50, s: 40 },
    { w: 1640, h: 30, s: 25 },
    { w: 1050, h: 85, s: 50, label: 'C–O' },
  ],
  amino_acid: [
    { w: 3100, h: 70, s: 100, label: 'N–H / O–H' },
    { w: 1600, h: 90, s: 25, label: 'COO⁻' },
    { w: 1400, h: 70, s: 25 },
    { w: 1150, h: 40, s: 30 },
  ],
  generic: [
    { w: 2950, h: 70, s: 40, label: 'C–H' },
    { w: 1450, h: 50, s: 25 },
    { w: 1100, h: 40, s: 40 },
  ],
}

/** Raman often enhances polarizable bonds; simplified teaching sets */
export const RAMAN_PROFILES = {
  water: [{ w: 3400, h: 40, s: 100 }, { w: 1640, h: 30, s: 30 }],
  aromatic: [
    { w: 3060, h: 55, s: 20 },
    { w: 1600, h: 100, s: 12, label: 'ring' },
    { w: 1000, h: 80, s: 12, label: 'ring breathing' },
    { w: 600, h: 40, s: 15 },
  ],
  alkane: [
    { w: 2900, h: 100, s: 40 },
    { w: 1450, h: 60, s: 20 },
    { w: 1300, h: 40, s: 20 },
  ],
  carbonyl: [
    { w: 1710, h: 70, s: 18, label: 'C=O' },
    { w: 1450, h: 40, s: 25 },
    { w: 800, h: 35, s: 25 },
  ],
  dye: [
    { w: 1600, h: 100, s: 15 },
    { w: 1350, h: 85, s: 15 },
    { w: 1180, h: 60, s: 15 },
    { w: 600, h: 45, s: 20 },
  ],
  generic: [
    { w: 2900, h: 80, s: 40 },
    { w: 1450, h: 50, s: 25 },
    { w: 1000, h: 40, s: 30 },
  ],
}

/** Map compound id or family → IR profile key */
export function irProfileFor(id, family, formula) {
  const map = {
    water: 'water',
    'heavy-water': 'water',
    ethanol: 'alcohol',
    methanol: 'alcohol',
    isopropanol: 'alcohol',
    't-butanol': 'alcohol',
    glycerol: 'alcohol',
    'ethylene-glycol': 'alcohol',
    acetone: 'ketone',
    acetophenone: 'ketone',
    benzophenone: 'ketone',
    'acetic-acid': 'carboxylic',
    'formic-acid': 'carboxylic',
    aspirin: 'carboxylic',
    ibuprofen: 'carboxylic',
    benzene: 'aromatic',
    toluene: 'aromatic',
    naphthalene: 'aromatic',
    anthracene: 'aromatic',
    phenol: 'phenol',
    aniline: 'amine',
    caffeine: 'amide',
    'ethyl-acetate': 'ester',
    diethyl_ether: 'ether',
    'diethyl-ether': 'ether',
    thf: 'ether',
    dioxane: 'ether',
    acetonitrile: 'nitrile',
    nitrobenzene: 'nitro',
    glucose: 'sugar',
    sucrose: 'sugar',
    glycine: 'amino_acid',
    alanine: 'amino_acid',
    tryptophan: 'amino_acid',
    hexane: 'alkane',
    cyclohexane: 'alkane',
    butane: 'alkane',
    propane: 'alkane',
    methane: 'alkane',
    ethane: 'alkane',
    fluorescein: 'dye',
    'rhodamine-b': 'dye',
    'methylene-blue': 'dye',
    'crystal-violet': 'dye',
    indigo: 'dye',
    curcumin: 'dye',
    quinine: 'aromatic',
    'chlorophyll-a': 'dye',
    urea: 'amide',
    dmf: 'amide',
    formamide: 'amide',
  }
  if (map[id]) return map[id]
  if (family === 'dyes' || family === 'xanthenes' || family === 'food') return 'dye'
  if (family === 'aromatic-hydrocarbons' || family === 'pahs') return 'aromatic'
  if (family === 'solvents' && formula?.includes('O')) return 'alcohol'
  if (family === 'biomolecules') return 'amino_acid'
  if (family === 'pharmaceuticals') return 'generic'
  if (family === 'quinones') return 'carbonyl'
  return 'generic'
}

export function ramanProfileFor(id, family) {
  if (id === 'water' || id === 'heavy-water') return 'water'
  if (['benzene', 'toluene', 'naphthalene', 'anthracene', 'pyrene'].includes(id)) return 'aromatic'
  if (family === 'dyes' || family === 'xanthenes') return 'dye'
  if (family === 'aromatic-hydrocarbons' || family === 'pahs') return 'aromatic'
  if (id === 'acetone' || id === 'acetic-acid') return 'carbonyl'
  if (['hexane', 'cyclohexane', 'methane', 'ethane'].includes(id)) return 'alkane'
  return 'generic'
}

export function makeWavenumberSpectrum(peaks, xMin = 400, xMax = 4000, step = 4) {
  const points = []
  const maxH = Math.max(...peaks.map((p) => p.h), 1)
  for (let x = xMin; x <= xMax + 1e-9; x += step) {
    let y = 0
    for (const p of peaks) {
      const d = (x - p.w) / p.s
      y += p.h * Math.exp(-0.5 * d * d)
    }
    y += maxH * 0.01
    points.push([Math.round(x), Math.round((y / maxH) * 1000) / 10])
  }
  return points
}

export function buildIrSpectrum(id, family, formula) {
  const key = irProfileFor(id, family, formula)
  const peaks = IR_PROFILES[key] || IR_PROFILES.generic
  const raw = makeWavenumberSpectrum(peaks)
  // IR plots traditionally high→low cm⁻¹; store ascending, reverse in UI
  const top = [...peaks].sort((a, b) => b.h - a.h).slice(0, 4)
  const labels = top
    .filter((p) => p.label)
    .map((p) => `${p.label} ~${p.w}`)
    .join('; ')
  return {
    id: `${id}-ir`,
    technique: 'ir',
    kind: 'infrared',
    solvent: 'neat / KBr (teaching)',
    y_unit: 'normalized',
    y_unit_label: 'Relative absorbance',
    peak_positions: top.map((p) => p.w),
    peak_labels: top.map((p) => p.label || `${p.w} cm⁻¹`),
    plain_caption: labels
      ? `IR fingerprint: ${labels}. Peaks mark how bonds stretch and bend.`
      : 'IR spectrum shows which bond vibrations absorb infrared light (teaching envelope).',
    display_points: downsample(raw, 700),
    quality: 'teaching',
    source: {
      citation:
        'Educational multi-Gaussian IR envelope from typical functional-group wavenumbers (not a raw FTIR file).',
      license: 'CC-BY-4.0 packaging',
      note: 'Teaching IR',
    },
  }
}

export function buildRamanSpectrum(id, family) {
  const key = ramanProfileFor(id, family)
  const peaks = RAMAN_PROFILES[key] || RAMAN_PROFILES.generic
  const raw = makeWavenumberSpectrum(peaks, 200, 3500, 4)
  const top = [...peaks].sort((a, b) => b.h - a.h).slice(0, 4)
  const labels = top
    .filter((p) => p.label)
    .map((p) => `${p.label} ~${p.w}`)
    .join('; ')
  return {
    id: `${id}-raman`,
    technique: 'raman',
    kind: 'raman',
    solvent: 'solid / pure liquid (teaching)',
    y_unit: 'normalized',
    y_unit_label: 'Relative Raman intensity',
    peak_positions: top.map((p) => p.w),
    peak_labels: top.map((p) => p.label || `${p.w} cm⁻¹`),
    plain_caption: labels
      ? `Raman shifts: ${labels}. Raman highlights polarizable bonds (teaching envelope).`
      : 'Raman spectrum is a vibrational fingerprint via light scattering (teaching envelope).',
    display_points: downsample(raw, 700),
    quality: 'teaching',
    source: {
      citation:
        'Educational multi-Gaussian Raman envelope from typical shifts (not a raw spectrometer file).',
      license: 'CC-BY-4.0 packaging',
      note: 'Teaching Raman',
    },
  }
}

function downsample(points, maxPts = 700) {
  if (points.length <= maxPts) return points
  const step = Math.ceil(points.length / maxPts)
  const out = []
  for (let i = 0; i < points.length; i += step) out.push(points[i])
  const last = points[points.length - 1]
  if (out[out.length - 1][0] !== last[0]) out.push(last)
  return out
}

/** Extra catalog majors for scale (id, name, family, cas, formula, mw, smiles, cid) */
export const EXTRA_STUBS = [
  ['acetaldehyde', 'Acetaldehyde', 'solvents', '75-07-0', 'C2H4O', 44.05, 'CC=O', 177],
  ['formaldehyde', 'Formaldehyde', 'solvents', '50-00-0', 'CH2O', 30.03, 'C=O', 712],
  ['acetic-anhydride', 'Acetic anhydride', 'solvents', '108-24-7', 'C4H6O3', 102.09, 'CC(=O)OC(C)=O', 7918],
  ['propionic-acid', 'Propionic acid', 'solvents', '79-09-4', 'C3H6O2', 74.08, 'CCC(=O)O', 1032],
  ['butyric-acid', 'Butyric acid', 'solvents', '107-92-6', 'C4H8O2', 88.11, 'CCCC(=O)O', 264],
  ['oleic-acid', 'Oleic acid', 'biomolecules', '112-80-1', 'C18H34O2', 282.46, '', 445639],
  ['stearic-acid', 'Stearic acid', 'biomolecules', '57-11-4', 'C18H36O2', 284.48, '', 5281],
  ['palmitic-acid', 'Palmitic acid', 'biomolecules', '57-10-3', 'C16H32O2', 256.42, '', 985],
  ['linoleic-acid', 'Linoleic acid', 'biomolecules', '60-33-3', 'C18H32O2', 280.45, '', 5280450],
  ['cholesterol-acetate', 'Cholesteryl acetate', 'biomolecules', '604-35-3', 'C29H48O2', 428.7, '', 6426551],
  ['camphor', 'Camphor', 'food', '76-22-2', 'C10H16O', 152.23, '', 2537],
  ['menthone', 'Menthone', 'food', '89-80-5', 'C10H18O', 154.25, '', 26447],
  ['carvone', 'Carvone', 'food', '99-49-0', 'C10H14O', 150.22, '', 7439],
  ['thymol', 'Thymol', 'food', '89-83-8', 'C10H14O', 150.22, '', 6989],
  ['carvacrol', 'Carvacrol', 'food', '499-75-2', 'C10H14O', 150.22, '', 10364],
  ['guaiacol', 'Guaiacol', 'food', '90-05-1', 'C7H8O2', 124.14, '', 460],
  ['syringol', 'Syringol', 'food', '91-10-1', 'C8H10O3', 154.16, '', 7041],
  ['furfural', 'Furfural', 'food', '98-01-1', 'C5H4O2', 96.08, '', 7362],
  ['hmf', '5-HMF', 'food', '67-47-0', 'C6H6O3', 126.11, '', 237332],
  ['maltol', 'Maltol', 'food', '118-71-8', 'C6H6O3', 126.11, '', 8369],
  ['ethyl-vanillin', 'Ethyl vanillin', 'food', '121-32-4', 'C9H10O3', 166.17, '', 8467],
  ['coumarin-derivative', '4-Hydroxycoumarin', 'coumarins', '1076-38-6', 'C9H6O3', 162.14, '', 54682930],
  ['warfarin-alcohol', 'Warfarin alcohol', 'pharmaceuticals', '1786-05-6', 'C19H18O4', 310.34, '', 54678487],
  ['diclofenac', 'Diclofenac', 'pharmaceuticals', '15307-86-5', 'C14H11Cl2NO2', 296.15, '', 3033],
  ['naproxen', 'Naproxen', 'pharmaceuticals', '22204-53-1', 'C14H14O3', 230.26, '', 156391],
  ['celecoxib', 'Celecoxib', 'pharmaceuticals', '169590-42-5', 'C17H14F3N3O2S', 381.37, '', 2662],
  ['atorvastatin', 'Atorvastatin', 'pharmaceuticals', '134523-00-5', 'C33H35FN2O5', 558.64, '', 60823],
  ['simvastatin', 'Simvastatin', 'pharmaceuticals', '79902-63-9', 'C25H38O5', 418.57, '', 54454],
  ['metoprolol', 'Metoprolol', 'pharmaceuticals', '37350-58-6', 'C15H25NO3', 267.36, '', 4171],
  ['atenolol', 'Atenolol', 'pharmaceuticals', '29122-68-7', 'C14H22N2O3', 266.34, '', 2249],
  ['amlodipine', 'Amlodipine', 'pharmaceuticals', '88150-42-9', 'C20H25ClN2O5', 408.88, '', 2162],
  ['losartan', 'Losartan', 'pharmaceuticals', '114798-26-4', 'C22H23ClN6O', 422.91, '', 3961],
  ['lisinopril', 'Lisinopril', 'pharmaceuticals', '83915-83-7', 'C21H31N3O5', 405.49, '', 5362119],
  ['sertraline', 'Sertraline', 'pharmaceuticals', '79617-96-2', 'C17H17Cl2N', 306.23, '', 68617],
  ['venlafaxine', 'Venlafaxine', 'pharmaceuticals', '93413-69-5', 'C17H27NO2', 277.4, '', 5656],
  ['bupropion', 'Bupropion', 'pharmaceuticals', '34911-55-2', 'C13H18ClNO', 239.74, '', 444],
  ['alprazolam', 'Alprazolam', 'pharmaceuticals', '28981-97-7', 'C17H13ClN4', 308.76, '', 2118],
  ['clonazepam', 'Clonazepam', 'pharmaceuticals', '1622-61-3', 'C15H10ClN3O3', 315.71, '', 2802],
  ['lorazepam', 'Lorazepam', 'pharmaceuticals', '846-49-1', 'C15H10Cl2N2O2', 321.16, '', 3958],
  ['zolpidem', 'Zolpidem', 'pharmaceuticals', '82626-48-0', 'C19H21N3O', 307.39, '', 5732],
  ['omeprazole-s', 'Esomeprazole', 'pharmaceuticals', '119141-88-7', 'C17H19N3O3S', 345.42, '', 9568614],
  ['pantoprazole', 'Pantoprazole', 'pharmaceuticals', '102625-70-7', 'C16H15F2N3O4S', 383.37, '', 4679],
  ['ranitidine', 'Ranitidine', 'pharmaceuticals', '66357-35-5', 'C13H22N4O3S', 314.4, '', 3001055],
  ['cetirizine', 'Cetirizine', 'pharmaceuticals', '83881-51-0', 'C21H25ClN2O3', 388.89, '', 2678],
  ['loratadine', 'Loratadine', 'pharmaceuticals', '79794-75-5', 'C22H23ClN2O2', 382.88, '', 3957],
  ['fexofenadine', 'Fexofenadine', 'pharmaceuticals', '83799-24-0', 'C32H39NO4', 501.66, '', 3348],
  ['montelukast', 'Montelukast', 'pharmaceuticals', '158966-92-8', 'C35H36ClNO3S', 586.18, '', 5281040],
  ['salbutamol', 'Salbutamol', 'pharmaceuticals', '18559-94-9', 'C13H21NO3', 239.31, '', 2083],
  ['budesonide', 'Budesonide', 'pharmaceuticals', '51333-22-3', 'C25H34O6', 430.53, '', 5281004],
  ['prednisone', 'Prednisone', 'pharmaceuticals', '53-03-2', 'C21H26O5', 358.43, '', 5865],
  ['dexamethasone', 'Dexamethasone', 'pharmaceuticals', '50-02-2', 'C22H29FO5', 392.46, '', 5743],
  ['hydrocortisone', 'Hydrocortisone', 'pharmaceuticals', '50-23-7', 'C21H30O5', 362.46, '', 5754],
  ['testosterone', 'Testosterone', 'biomolecules', '58-22-0', 'C19H28O2', 288.42, '', 6013],
  ['estradiol', 'Estradiol', 'biomolecules', '50-28-2', 'C18H24O2', 272.38, '', 5757],
  ['progesterone', 'Progesterone', 'biomolecules', '57-83-0', 'C21H30O2', 314.46, '', 5994],
  ['cortisol', 'Cortisol', 'biomolecules', '50-23-7', 'C21H30O5', 362.46, '', 5754],
  ['adrenaline', 'Adrenaline', 'biomolecules', '51-43-4', 'C9H13NO3', 183.2, '', 5816],
  ['melanin-indole', '5,6-Dihydroxyindole', 'biomolecules', '3131-52-0', 'C8H7NO2', 149.15, '', 114556],
  ['heme-c', 'Heme C', 'porphyrins', '26598-29-8', 'C34H34FeN4O4S2', 700.64, '', 444097],
  ['bilirubin-ix', 'Bilirubin IXα', 'biomolecules', '635-65-4', 'C33H36N4O6', 584.66, '', 5280352],
  ['pheophorbide-a', 'Pheophorbide a', 'porphyrins', '15664-29-6', 'C35H36N4O5', 592.68, '', 135398660],
  ['pyropheophorbide', 'Pyropheophorbide a', 'porphyrins', '24533-72-0', 'C33H34N4O3', 534.65, '', 135398659],
  ['phthalocyanine-zn', 'Zinc phthalocyanine', 'porphyrins', '14320-04-8', 'C32H16N8Zn', 577.91, '', 144543],
  ['naphthalocyanine', 'Naphthalocyanine', 'porphyrins', '23627-87-4', 'C48H26N8', 714.77, '', 643327],
  ['bodipy-493', 'BODIPY 493/503', 'dyes', '121207-31-6', 'C14H17BF2N2', 262.11, '', 16218639],
  ['cy7', 'Cyanine Cy7', 'dyes', '943298-08-6', 'C35H42ClN2O', 542.18, '', 102166755],
  ['alexa-647', 'Alexa Fluor 647', 'dyes', '400051-23-2', 'C37H37N3O15S4', 915.99, '', 16218503],
  ['fitc', 'FITC', 'dyes', '3326-32-7', 'C21H11NO5S', 389.38, '', 18730],
  ['tritic', 'TRITC', 'dyes', '80724-19-2', 'C25H21N3O5S', 475.52, '', 16218640],
  ['coumarin-6', 'Coumarin 6', 'coumarins', '38215-36-0', 'C20H18N2O2S', 350.43, '', 100528],
  ['coumarin-153', 'Coumarin 153', 'coumarins', '53518-18-6', 'C16H14F3NO2', 309.28, '', 104855],
  ['perylene-diimide', 'Perylene diimide', 'pahs', '128-69-8', 'C24H10N2O4', 390.35, '', 67191],
  ['terrylene', 'Terrylene', 'pahs', '188-72-7', 'C30H16', 376.45, '', 123043],
  ['ovalene', 'Ovalene', 'pahs', '190-26-1', 'C32H14', 398.44, '', 123049],
  ['coronene-d12', 'Coronene-d12', 'pahs', '16083-71-1', 'C24D12', 312.42, '', 9115],
  ['buckminsterfullerene', 'C60 fullerene', 'pahs', '99685-96-8', 'C60', 720.64, '', 123591],
  ['c70', 'Fullerene C70', 'pahs', '115383-22-7', 'C70', 840.75, '', 123592],
  ['graphene-oxide', 'Graphene oxide (model)', 'pahs', '7782-42-5', 'C', 12.01, '', 5462310],
  ['aniline-hcl', 'Aniline hydrochloride', 'aromatic-hydrocarbons', '142-04-1', 'C6H8ClN', 129.59, '', 8871],
  ['nitroaniline-p', 'p-Nitroaniline', 'aromatic-hydrocarbons', '100-01-6', 'C6H6N2O2', 138.12, '', 7475],
  ['dinitrobenzene', '1,3-Dinitrobenzene', 'aromatic-hydrocarbons', '99-65-0', 'C6H4N2O4', 168.11, '', 7452],
  ['trinitrobenzene', '1,3,5-Trinitrobenzene', 'aromatic-hydrocarbons', '99-35-4', 'C6H3N3O6', 213.1, '', 7452],
  ['picric-acid', 'Picric acid', 'aromatic-hydrocarbons', '88-89-1', 'C6H3N3O7', 229.1, '', 6954],
  ['hydroquinone', 'Hydroquinone', 'aromatic-hydrocarbons', '123-31-9', 'C6H6O2', 110.11, '', 785],
  ['catechol', 'Catechol', 'aromatic-hydrocarbons', '120-80-9', 'C6H6O2', 110.11, '', 289],
  ['resorcinol', 'Resorcinol', 'aromatic-hydrocarbons', '108-46-3', 'C6H6O2', 110.11, '', 5054],
  ['pyrogallol', 'Pyrogallol', 'aromatic-hydrocarbons', '87-66-1', 'C6H6O3', 126.11, '', 1057],
  ['gallic-acid', 'Gallic acid', 'food', '149-91-7', 'C7H6O5', 170.12, '', 370],
  ['caffeic-acid', 'Caffeic acid', 'food', '331-39-5', 'C9H8O4', 180.16, '', 689043],
  ['ferulic-acid', 'Ferulic acid', 'food', '1135-24-6', 'C10H10O4', 194.18, '', 445858],
  ['chlorogenic-acid', 'Chlorogenic acid', 'food', '327-97-9', 'C16H18O9', 354.31, '', 1794427],
  ['rutin', 'Rutin', 'food', '153-18-4', 'C27H30O16', 610.52, '', 5280805],
  ['naringenin', 'Naringenin', 'food', '480-41-1', 'C15H12O5', 272.25, '', 439246],
  ['hesperidin', 'Hesperidin', 'food', '520-26-3', 'C28H34O15', 610.56, '', 10621],
  ['apigenin', 'Apigenin', 'food', '520-36-5', 'C15H10O5', 270.24, '', 5280443],
  ['luteolin', 'Luteolin', 'food', '491-70-3', 'C15H10O6', 286.24, '', 5280445],
  ['catechin', 'Catechin', 'food', '154-23-4', 'C15H14O6', 290.27, '', 9064],
  ['epigallocatechin', 'Epigallocatechin', 'food', '970-74-1', 'C15H14O7', 306.27, '', 72277],
  ['theanine', 'L-Theanine', 'biomolecules', '3081-61-6', 'C7H14N2O3', 174.2, '', 439378],
  ['taurine', 'Taurine', 'biomolecules', '107-35-7', 'C2H7NO3S', 125.15, '', 1123],
  ['carnitine', 'L-Carnitine', 'biomolecules', '541-15-1', 'C7H15NO3', 161.2, '', 10917],
  ['creatine', 'Creatine', 'biomolecules', '57-00-1', 'C4H9N3O2', 131.13, '', 586],
  ['carnosine', 'Carnosine', 'biomolecules', '305-84-0', 'C9H14N4O3', 226.23, '', 439224],
  ['glutathione', 'Glutathione', 'biomolecules', '70-18-8', 'C10H17N3O6S', 307.32, '', 124886],
  ['nad', 'NAD+', 'biomolecules', '53-84-9', 'C21H26N7O14P2', 663.43, '', 5892],
  ['nadp', 'NADP+', 'biomolecules', '53-59-8', 'C21H28N7O17P3', 743.41, '', 5886],
  ['fmn', 'FMN', 'biomolecules', '146-17-8', 'C17H21N4O9P', 456.34, '', 643976],
  ['coenzyme-a', 'Coenzyme A', 'biomolecules', '85-61-0', 'C21H36N7O16P3S', 767.53, '', 6816],
  ['acetyl-coa', 'Acetyl-CoA', 'biomolecules', '72-89-9', 'C23H38N7O17P3S', 809.57, '', 444493],
  ['squalene', 'Squalene', 'biomolecules', '111-02-4', 'C30H50', 410.72, '', 638072],
  ['beta-sitosterol', 'β-Sitosterol', 'biomolecules', '83-46-5', 'C29H50O', 414.71, '', 222284],
  ['stigmasterol', 'Stigmasterol', 'biomolecules', '83-48-7', 'C29H48O', 412.69, '', 5280794],
  ['ergosterol', 'Ergosterol', 'biomolecules', '57-87-4', 'C28H44O', 396.65, '', 444679],
  ['ubiquinone-0', 'Ubiquinone-0', 'quinones', '605-94-7', 'C9H10O4', 182.17, '', 11805],
  ['plastoquinone', 'Plastoquinone-9', 'quinones', '4299-57-4', 'C53H80O2', 749.2, '', 6433377],
  ['phylloquinone', 'Phylloquinone', 'quinones', '84-80-0', 'C31H46O2', 450.7, '', 5284607],
  ['menaquinone-7', 'Menaquinone-7', 'quinones', '2124-57-4', 'C46H64O2', 649.0, '', 5282767],
  ['lawsone-isopropyl', 'Isopropyl lawsone', 'quinones', '26063-14-7', 'C13H12O3', 216.23, '', 10213],
  ['naphthol-1', '1-Naphthol', 'pahs', '90-15-3', 'C10H8O', 144.17, '', 7005],
  ['naphthol-2', '2-Naphthol', 'pahs', '135-19-3', 'C10H8O', 144.17, '', 8663],
  ['anthracene-9-10-dione', 'Anthraquinone', 'quinones', '84-65-1', 'C14H8O2', 208.21, '', 6780],
  ['alizarin-red', 'Alizarin Red S', 'dyes', '130-22-3', 'C14H7NaO7S', 342.26, '', 8552],
  ['indigo-carmine-alt', 'Indigotine', 'dyes', '860-22-0', 'C16H8N2Na2O8S2', 466.35, '', 5284351],
  ['patent-blue', 'Patent Blue VF', 'dyes', '129-17-9', 'C27H31N2NaO6S2', 566.66, '', 6604561],
  ['brilliant-cresyl', 'Brilliant cresyl blue', 'dyes', '81029-05-2', 'C17H20ClN3O', 317.81, '', 16218641],
  ['janus-green', 'Janus green B', 'dyes', '2869-83-2', 'C30H31ClN6', 511.06, '', 16218642],
  ['methyl-orange', 'Methyl orange', 'dyes', '547-58-0', 'C14H14N3NaO3S', 327.33, '', 23673835],
  ['methyl-red', 'Methyl red', 'dyes', '493-52-7', 'C15H15N3O2', 269.3, '', 10303],
  ['methyl-yellow', 'Methyl yellow', 'dyes', '60-11-7', 'C14H15N3', 225.29, '', 6053],
  ['bromothymol-blue', 'Bromothymol blue', 'dyes', '76-59-5', 'C27H28Br2O5S', 624.38, '', 6450],
  ['phenol-red-na', 'Phenol red sodium', 'dyes', '34487-61-1', 'C19H13NaO5S', 376.36, '', 4766],
  ['cresol-red', 'Cresol red', 'dyes', '1733-12-6', 'C21H18O5S', 382.43, '', 73013],
  ['thymol-blue', 'Thymol blue', 'dyes', '76-61-9', 'C27H30O5S', 466.59, '', 6456],
  ['congo-red-alt', 'Direct Red 28', 'dyes', '573-58-0', 'C32H22N6Na2O6S2', 696.66, '', 11313],
  ['trypan-blue', 'Trypan blue', 'dyes', '72-57-1', 'C34H24N6Na4O14S4', 960.81, '', 9562061],
  ['evans-blue', 'Evans blue', 'dyes', '314-13-6', 'C34H24N6Na4O14S4', 960.81, '', 9562062],
  ['coomassie-blue', 'Coomassie Brilliant Blue R-250', 'dyes', '6104-59-2', 'C45H44N3NaO7S2', 825.97, '', 6333920],
  ['sypro-orange', 'SYPRO Orange', 'dyes', '205513-08-2', 'C28H37N3O3S', 495.68, '', 16218643],
  ['pico-green', 'PicoGreen', 'dyes', '177571-13-6', 'C32H37I2N3O3S', 813.53, '', 16218644],
  ['yo-pro-1', 'YO-PRO-1', 'dyes', '152068-09-2', 'C24H29IN3OS', 534.48, '', 16218645],
  ['to-pro-3', 'TO-PRO-3', 'dyes', '157199-63-8', 'C26H31IN3S', 545.53, '', 16218646],
  ['propidium-iodide', 'Propidium iodide', 'dyes', '25535-16-4', 'C27H34I2N4', 668.39, '', 104981],
  ['7aad', '7-AAD', 'dyes', '7240-37-1', 'C22H22N6O4', 434.45, '', 16218647],
  ['annexin-v-fitc', 'Annexin V-FITC (label)', 'dyes', '0-00-0', 'label', 0, '', 18730],
]
