/**
 * Build public/dataset (index + compound JSON).
 * Run: node tools/build-dataset.mjs
 *
 * UV teaching seeds: data/uv-seeds/*.json (see docs/ADD_SPECTRUM.md)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  EXTRA_STUBS,
  buildIrSpectrum,
  buildRamanSpectrum,
} from './ir-raman-lib.mjs'
import {
  assertValidSeeds,
  loadUvSeedFiles,
} from './validate-seeds.mjs'
import { validateDatasetTree } from './validate-dataset.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outRoot = path.join(__dirname, '..', 'public', 'dataset')
const compoundsDir = path.join(outRoot, 'compounds')

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true })
}

/** Multi-Gaussian teaching spectrum. peaks: [{lambda, height, sigma}] */
function makeSpectrum(peaks, xMin, xMax, step = 0.5) {
  const points = []
  for (let x = xMin; x <= xMax + 1e-9; x += step) {
    let y = 0
    for (const p of peaks) {
      const d = (x - p.lambda) / p.sigma
      y += p.height * Math.exp(-0.5 * d * d)
    }
    // tiny baseline
    y += Math.max(...peaks.map((p) => p.height)) * 0.002
    points.push([Math.round(x * 100) / 100, Math.round(y * 10) / 10])
  }
  return points
}

function downsample(points, maxPts = 900) {
  if (points.length <= maxPts) return points
  const step = Math.ceil(points.length / maxPts)
  const out = []
  for (let i = 0; i < points.length; i += step) out.push(points[i])
  const last = points[points.length - 1]
  if (out[out.length - 1][0] !== last[0]) out.push(last)
  return out
}

const FAMILIES = {
  'aromatic-hydrocarbons': 'Aromatic hydrocarbons',
  pahs: 'Polycyclic aromatic hydrocarbons',
  dyes: 'Dyes & fluorophores',
  xanthenes: 'Xanthenes',
  coumarins: 'Coumarins',
  porphyrins: 'Porphyrins & tetrapyrroles',
  biomolecules: 'Biomolecules',
  solvents: 'Common solvents',
  heterocycles: 'Heterocycles',
  pharmaceuticals: 'Common pharmaceuticals',
  food: 'Food & natural colors',
  quinones: 'Quinones',
}

/** Extra searchable majors (tier C stubs) — name + ids for PubChem 3D on demand */
const STUBS = [
  ['water', 'Water', 'solvents', '7732-18-5', 'H2O', 18.02, 'O', 962],
  ['ethanol', 'Ethanol', 'solvents', '64-17-5', 'C2H6O', 46.07, 'CCO', 702],
  ['methanol', 'Methanol', 'solvents', '67-56-1', 'CH4O', 32.04, 'CO', 887],
  ['dmso', 'Dimethyl sulfoxide', 'solvents', '67-68-5', 'C2H6OS', 78.13, 'CS(=O)C', 679],
  ['chloroform', 'Chloroform', 'solvents', '67-66-3', 'CHCl3', 119.38, 'ClC(Cl)Cl', 6212],
  ['toluene', 'Toluene', 'aromatic-hydrocarbons', '108-88-3', 'C7H8', 92.14, 'Cc1ccccc1', 1140],
  ['styrene', 'Styrene', 'aromatic-hydrocarbons', '100-42-5', 'C8H8', 104.15, 'C=Cc1ccccc1', 7501],
  ['phenol-red', 'Phenol red', 'dyes', '143-74-8', 'C19H14O5S', 354.38, '', 4766],
  ['bromophenol-blue', 'Bromophenol blue', 'dyes', '115-39-9', 'C19H10Br4O5S', 669.96, '', 8272],
  ['sudan-i', 'Sudan I', 'dyes', '842-07-9', 'C16H12N2O', 248.28, '', 13252],
  ['malachite-green', 'Malachite green', 'dyes', '569-64-2', 'C23H25ClN2', 364.91, '', 11294],
  ['safranin-o', 'Safranin O', 'dyes', '477-73-6', 'C20H19ClN4', 350.84, '', 2723801],
  ['congo-red', 'Congo red', 'dyes', '573-58-0', 'C32H22N6Na2O6S2', 696.66, '', 11313],
  ['indigo-carmine', 'Indigo carmine', 'dyes', '860-22-0', 'C16H8N2Na2O8S2', 466.35, '', 5284351],
  ['brilliant-blue-fcf', 'Brilliant Blue FCF', 'food', '3844-45-9', 'C37H34N2Na2O9S3', 792.85, '', 19700],
  ['tartrazine', 'Tartrazine', 'food', '1934-21-0', 'C16H9N4Na3O9S2', 534.36, '', 164825],
  ['allura-red-ac', 'Allura Red AC', 'food', '25956-17-6', 'C18H14N2Na2O8S2', 496.42, '', 33258],
  ['lycopene', 'Lycopene', 'food', '502-65-8', 'C40H56', 536.87, '', 446925],
  ['lutein', 'Lutein', 'food', '127-40-2', 'C40H56O2', 568.87, '', 5281243],
  ['astaxanthin', 'Astaxanthin', 'food', '472-61-7', 'C40H52O4', 596.84, '', 5281224],
  ['chlorophyll-b', 'Chlorophyll b', 'porphyrins', '519-62-0', 'C55H70MgN4O6', 907.47, '', 11593175],
  ['heme', 'Heme b', 'porphyrins', '14875-96-8', 'C34H32FeN4O4', 616.49, '', 26945],
  ['vitamin-b12', 'Vitamin B12', 'biomolecules', '68-19-9', 'C63H88CoN14O14P', 1355.37, '', 5311498],
  ['nadh', 'NADH', 'biomolecules', '58-68-4', 'C21H29N7O14P2', 663.43, '', 439153],
  ['fad', 'FAD', 'biomolecules', '146-14-5', 'C27H33N9O15P2', 785.55, '', 643975],
  ['tyrosine', 'Tyrosine', 'biomolecules', '60-18-4', 'C9H11NO3', 181.19, 'N[C@@H](Cc1ccc(O)cc1)C(=O)O', 6057],
  ['phenylalanine', 'Phenylalanine', 'biomolecules', '63-91-2', 'C9H11NO2', 165.19, 'N[C@@H](Cc1ccccc1)C(=O)O', 6140],
  ['adenine', 'Adenine', 'biomolecules', '73-24-5', 'C5H5N5', 135.13, 'n1cnc2c(ncnc12)N', 190],
  ['thymine', 'Thymine', 'biomolecules', '65-71-4', 'C5H6N2O2', 126.11, 'Cc1c[nH]c(=O)[nH]c1=O', 1135],
  ['guanine', 'Guanine', 'biomolecules', '73-40-5', 'C5H5N5O', 151.13, 'Nc1nc2[nH]cnc2c(=O)[nH]1', 764],
  ['cytosine', 'Cytosine', 'biomolecules', '71-30-7', 'C4H5N3O', 111.1, 'Nc1cc[nH]c(=O)n1', 597],
  ['uracil', 'Uracil', 'biomolecules', '66-22-8', 'C4H4N2O2', 112.09, 'O=c1cc[nH]c(=O)[nH]1', 1174],
  ['aspirin', 'Aspirin', 'pharmaceuticals', '50-78-2', 'C9H8O4', 180.16, 'CC(=O)Oc1ccccc1C(=O)O', 2244],
  ['ibuprofen', 'Ibuprofen', 'pharmaceuticals', '15687-27-1', 'C13H18O2', 206.28, 'CC(C)Cc1ccc(C(C)C(=O)O)cc1', 3672],
  ['paracetamol', 'Paracetamol', 'pharmaceuticals', '103-90-2', 'C8H9NO2', 151.16, 'CC(=O)Nc1ccc(O)cc1', 1983],
  ['penicillin-g', 'Penicillin G', 'pharmaceuticals', '61-33-6', 'C16H18N2O4S', 334.39, '', 5904],
  ['doxorubicin', 'Doxorubicin', 'pharmaceuticals', '23214-92-8', 'C27H29NO11', 543.52, '', 31703],
  ['cisplatin', 'Cisplatin', 'pharmaceuticals', '15663-27-1', 'Cl2H6N2Pt', 300.05, '', 441203],
  ['pyridine', 'Pyridine', 'heterocycles', '110-86-1', 'C5H5N', 79.1, 'c1ccncc1', 1049],
  ['quinoline', 'Quinoline', 'heterocycles', '91-22-5', 'C9H7N', 129.16, 'c1ccc2ncccc2c1', 7047],
  ['indole', 'Indole', 'heterocycles', '120-72-9', 'C8H7N', 117.15, 'c1ccc2[nH]ccc2c1', 798],
  ['furan', 'Furan', 'heterocycles', '110-00-9', 'C4H4O', 68.07, 'c1ccoc1', 8029],
  ['thiophene', 'Thiophene', 'heterocycles', '110-02-1', 'C4H4S', 84.14, 'c1ccsc1', 8030],
  ['pyrrole', 'Pyrrole', 'heterocycles', '109-97-7', 'C4H5N', 67.09, 'c1cc[nH]c1', 8027],
  ['biphenyl', 'Biphenyl', 'aromatic-hydrocarbons', '92-52-4', 'C12H10', 154.21, 'c1ccc(-c2ccccc2)cc1', 7095],
  ['phenanthrene', 'Phenanthrene', 'pahs', '85-01-8', 'C14H10', 178.23, '', 995],
  ['chrysene', 'Chrysene', 'pahs', '218-01-9', 'C18H12', 228.29, '', 9171],
  ['perylene', 'Perylene', 'pahs', '198-55-0', 'C20H12', 252.31, '', 9142],
  ['tetracene', 'Tetracene', 'pahs', '92-24-0', 'C18H12', 228.29, '', 7080],
  ['pentacene', 'Pentacene', 'pahs', '135-48-8', 'C22H14', 278.35, '', 8671],
  ['azulene', 'Azulene', 'pahs', '275-51-4', 'C10H8', 128.17, '', 9231],
  ['ferrocene', 'Ferrocene', 'aromatic-hydrocarbons', '102-54-5', 'C10H10Fe', 186.03, '', 7611],
  ['benzoquinone', '1,4-Benzoquinone', 'quinones', '106-51-4', 'C6H4O2', 108.09, 'O=C1C=CC(=O)C=C1', 4650],
  ['anthraquinone', 'Anthraquinone', 'quinones', '84-65-1', 'C14H8O2', 208.21, '', 6780],
  ['lawsone', 'Lawsone', 'quinones', '83-72-7', 'C10H6O3', 174.15, '', 6755],
  ['juglone', 'Juglone', 'quinones', '481-39-0', 'C10H6O3', 174.15, '', 3806],
  ['alizarin', 'Alizarin', 'quinones', '72-48-0', 'C14H8O4', 240.21, '', 6293],
  ['coumarin', 'Coumarin', 'coumarins', '91-64-5', 'C9H6O2', 146.14, 'O=c1ccc2ccccc2o1', 323],
  ['umbelliferone', 'Umbelliferone', 'coumarins', '93-35-6', 'C9H6O3', 162.14, '', 5281426],
  ['scopoletin', 'Scopoletin', 'coumarins', '92-61-5', 'C10H8O4', 192.17, '', 5280460],
  ['rose-bengal', 'Rose Bengal', 'xanthenes', '632-69-9', 'C20H2Cl4I4Na2O5', 1017.64, '', 32343],
  ['erythrosine', 'Erythrosine', 'xanthenes', '16423-68-0', 'C20H6I4Na2O5', 879.86, '', 3255],
  ['cy3', 'Cyanine Cy3', 'dyes', '146368-14-1', 'C31H38ClN2O', 490.1, '', 102166754],
  ['cy5', 'Cyanine Cy5', 'dyes', '146368-13-0', 'C33H40ClN2O', 516.14, '', 102166753],
  ['bodipy-fl', 'BODIPY FL', 'dyes', '165599-63-3', 'C14H17BF2N2', 262.11, '', 16218639],
  ['dapi', 'DAPI', 'dyes', '28718-90-3', 'C16H15N5', 277.32, '', 2954],
  ['hoechst-33342', 'Hoechst 33342', 'dyes', '23491-52-3', 'C27H28N6O', 452.55, '', 1464],
  ['protoporphyrin-ix', 'Protoporphyrin IX', 'porphyrins', '553-12-8', 'C34H34N4O4', 562.66, '', 4971],
  ['phthalocyanine', 'Phthalocyanine', 'porphyrins', '574-93-6', 'C32H18N8', 514.54, '', 5282330],
  ['copper-phthalocyanine', 'Copper phthalocyanine', 'porphyrins', '147-14-8', 'C32H16CuN8', 576.07, '', 14833],
  ['nicotine', 'Nicotine', 'pharmaceuticals', '54-11-5', 'C10H14N2', 162.23, '', 89594],
  ['morphine', 'Morphine', 'pharmaceuticals', '57-27-2', 'C17H19NO3', 285.34, '', 5288826],
  ['cocaine', 'Cocaine', 'pharmaceuticals', '50-36-2', 'C17H21NO4', 303.35, '', 446220],
  ['glucose', 'D-Glucose', 'biomolecules', '50-99-7', 'C6H12O6', 180.16, '', 5793],
  ['sucrose', 'Sucrose', 'biomolecules', '57-50-1', 'C12H22O11', 342.3, '', 5988],
  ['cholesterol', 'Cholesterol', 'biomolecules', '57-88-5', 'C27H46O', 386.65, '', 5997],
  ['atp', 'ATP', 'biomolecules', '56-65-5', 'C10H16N5O13P3', 507.18, '', 5957],
  ['dopamine', 'Dopamine', 'biomolecules', '51-61-6', 'C8H11NO2', 153.18, '', 681],
  ['serotonin', 'Serotonin', 'biomolecules', '50-67-9', 'C10H12N2O', 176.22, '', 5202],
  ['melatonin', 'Melatonin', 'biomolecules', '73-31-4', 'C13H16N2O2', 232.28, '', 896],
  ['vanillin', 'Vanillin', 'food', '121-33-5', 'C8H8O3', 152.15, '', 1183],
  ['capsaicin', 'Capsaicin', 'food', '404-86-4', 'C18H27NO3', 305.41, '', 1548943],
  ['cinnamaldehyde', 'Cinnamaldehyde', 'food', '104-55-2', 'C9H8O', 132.16, '', 637511],
  ['limonene', 'D-Limonene', 'food', '5989-27-5', 'C10H16', 136.23, '', 440917],
  ['menthol', 'Menthol', 'food', '89-78-1', 'C10H20O', 156.27, '', 1254],
  ['urea', 'Urea', 'biomolecules', '57-13-6', 'CH4N2O', 60.06, 'NC(=O)N', 1176],
  ['glycine', 'Glycine', 'biomolecules', '56-40-6', 'C2H5NO2', 75.07, 'NCC(=O)O', 750],
  ['histidine', 'Histidine', 'biomolecules', '71-00-1', 'C6H9N3O2', 155.15, '', 6274],
  ['heme-a', 'Heme A', 'porphyrins', '57560-12-0', 'C49H56O6N4Fe', 852.0, '', 5288529],
  ['bacteriochlorophyll-a', 'Bacteriochlorophyll a', 'porphyrins', '17499-98-8', 'C55H74MgN4O6', 911.5, '', 5479520],
  ['fullerene-c60', 'Fullerene C60', 'pahs', '99685-96-8', 'C60', 720.64, '', 123591],
  ['graphene-flake', 'Coronene', 'pahs', '191-07-1', 'C24H12', 300.35, '', 9115],
  ['ddt', 'DDT', 'pharmaceuticals', '50-29-3', 'C14H9Cl5', 354.49, '', 3036],
  ['tnt', '2,4,6-Trinitrotoluene', 'aromatic-hydrocarbons', '118-96-7', 'C7H5N3O6', 227.13, '', 8376],
  ['aniline-blue', 'Aniline blue', 'dyes', '28631-66-5', 'C32H25N3Na2O9S3', 737.74, '', 16218910],
  ['neutral-red', 'Neutral red', 'dyes', '553-24-2', 'C15H17ClN4', 288.78, '', 11105],
  ['toluidine-blue', 'Toluidine blue', 'dyes', '92-31-9', 'C15H16ClN3S', 305.83, '', 7083],
  ['fast-green-fcf', 'Fast Green FCF', 'food', '2353-45-9', 'C37H34N2Na2O10S3', 808.85, '', 16887],
  ['sunset-yellow-fcf', 'Sunset Yellow FCF', 'food', '2783-94-0', 'C16H10N2Na2O7S2', 452.37, '', 17730],
  ['amaranth-dye', 'Amaranth (dye)', 'food', '915-67-3', 'C20H11N2Na3O10S3', 604.47, '', 13542],
  ['vitamin-c', 'Ascorbic acid', 'biomolecules', '50-81-7', 'C6H8O6', 176.12, '', 54670067],
  ['vitamin-e', 'α-Tocopherol', 'biomolecules', '59-02-9', 'C29H50O2', 430.71, '', 14985],
  ['vitamin-d3', 'Cholecalciferol', 'biomolecules', '67-97-0', 'C27H44O', 384.64, '', 5280795],
  ['vitamin-k1', 'Phylloquinone', 'biomolecules', '84-80-0', 'C31H46O2', 450.7, '', 5284607],
  ['warfarin', 'Warfarin', 'pharmaceuticals', '81-81-2', 'C19H16O4', 308.33, '', 54678486],
  ['diazepam', 'Diazepam', 'pharmaceuticals', '439-14-5', 'C16H13ClN2O', 284.74, '', 3016],
  ['fluoxetine', 'Fluoxetine', 'pharmaceuticals', '54910-89-3', 'C17H18F3NO', 309.33, '', 3386],
  ['metformin', 'Metformin', 'pharmaceuticals', '657-24-9', 'C4H11N5', 129.16, '', 4091],
  ['omeprazole', 'Omeprazole', 'pharmaceuticals', '73590-58-6', 'C17H19N3O3S', 345.42, '', 4594],
  ['sildenafil', 'Sildenafil', 'pharmaceuticals', '139755-83-2', 'C22H30N6O4S', 474.58, '', 5212],
  ['thc', 'Δ9-THC', 'pharmaceuticals', '1972-08-3', 'C21H30O2', 314.46, '', 16078],
  ['cbd', 'Cannabidiol', 'pharmaceuticals', '13956-29-1', 'C21H30O2', 314.46, '', 644019],
  ['psilocybin', 'Psilocybin', 'pharmaceuticals', '520-52-5', 'C12H17N2O4P', 284.25, '', 10624],
  ['lsd', 'LSD', 'pharmaceuticals', '50-37-3', 'C20H25N3O', 323.43, '', 5761],
  ['mdma', 'MDMA', 'pharmaceuticals', '42542-10-9', 'C11H15NO2', 193.24, '', 1615],
  ['amphetamine', 'Amphetamine', 'pharmaceuticals', '300-62-9', 'C9H13N', 135.21, '', 3007],
  ['benzene-1', 'Ethylbenzene', 'aromatic-hydrocarbons', '100-41-4', 'C8H10', 106.17, 'CCc1ccccc1', 7500],
  ['xylene-p', 'p-Xylene', 'aromatic-hydrocarbons', '106-42-3', 'C8H10', 106.17, 'Cc1ccc(C)cc1', 7809],
  ['mesitylene', 'Mesitylene', 'aromatic-hydrocarbons', '108-67-8', 'C9H12', 120.19, 'Cc1cc(C)cc(C)c1', 7947],
  ['benzophenone', 'Benzophenone', 'aromatic-hydrocarbons', '119-61-9', 'C13H10O', 182.22, 'O=C(c1ccccc1)c1ccccc1', 3102],
  ['stilbene', 'trans-Stilbene', 'aromatic-hydrocarbons', '103-30-0', 'C14H12', 180.25, '', 638088],
  ['diphenylacetylene', 'Diphenylacetylene', 'aromatic-hydrocarbons', '501-65-5', 'C14H10', 178.23, '', 10387],
  ['acridine', 'Acridine', 'heterocycles', '260-94-6', 'C13H9N', 179.22, '', 9215],
  ['phenazine', 'Phenazine', 'heterocycles', '92-82-0', 'C12H8N2', 180.21, '', 4757],
  ['phenothiazine', 'Phenothiazine', 'heterocycles', '92-84-2', 'C12H9NS', 199.27, '', 7108],
  ['carbazole', 'Carbazole', 'heterocycles', '86-74-8', 'C12H9N', 167.21, '', 6854],
  ['fluorene', 'Fluorene', 'pahs', '86-73-7', 'C13H10', 166.22, '', 6853],
  ['fluoranthene', 'Fluoranthene', 'pahs', '206-44-0', 'C16H10', 202.25, '', 9154],
  ['benzo-a-pyrene', 'Benzo[a]pyrene', 'pahs', '50-32-8', 'C20H12', 252.31, '', 2336],
  ['dibenzanthracene', 'Dibenz[a,h]anthracene', 'pahs', '53-70-3', 'C22H14', 278.35, '', 5889],
  ['rose-bengal-lactone', 'Rhodamine 6G', 'xanthenes', '989-38-8', 'C28H31ClN2O3', 479.02, '', 13806],
  ['texas-red', 'Texas Red', 'xanthenes', '82354-19-6', 'C37H33ClN2O6S2', 701.26, '', 16219392],
  ['alexa-488', 'Alexa Fluor 488', 'dyes', '247144-99-6', 'C25H15N3O13S2', 643.53, '', 16218502],
  ['nile-red', 'Nile red', 'dyes', '7385-67-3', 'C20H18N2O2', 318.37, '', 65182],
  ['nile-blue', 'Nile blue', 'dyes', '3625-57-8', 'C20H20ClN3O', 353.85, '', 457831],
  ['proflavin', 'Proflavine', 'heterocycles', '92-62-6', 'C13H11N3', 209.25, '', 7099],
  ['ethidium-bromide', 'Ethidium bromide', 'dyes', '1239-45-8', 'C21H20BrN3', 394.31, '', 14710],
  ['thiazole-orange', 'Thiazole orange', 'dyes', '107091-89-4', 'C26H24N2S', 396.55, '', 6438303],
  ['thioflavin-t', 'Thioflavin T', 'dyes', '2390-54-7', 'C17H19ClN2S', 318.86, '', 16953],
  ['congo-corinth', 'Direct Red 23', 'dyes', '3441-14-3', 'C35H25N7Na2O10S2', 813.73, '', 13542],
  ['patent-blue-v', 'Patent Blue V', 'food', '3536-49-0', 'C27H31N2NaO6S2', 566.66, '', 5284525],
  ['carmoisine', 'Carmoisine', 'food', '3567-69-9', 'C20H12N2Na2O7S2', 502.43, '', 19118],
  ['ponceau-4r', 'Ponceau 4R', 'food', '2611-82-7', 'C20H11N2Na3O10S3', 604.47, '', 19150],
  ['erythrosin-b', 'Erythrosin B', 'xanthenes', '16423-68-0', 'C20H6I4Na2O5', 879.86, '', 3255],
  ['phloxine-b', 'Phloxine B', 'xanthenes', '18472-87-2', 'C20H2Br4Cl4Na2O5', 829.63, '', 32343],
  ['merocyanine-540', 'Merocyanine 540', 'dyes', '62796-23-0', 'C26H32N3NaO6S2', 569.67, '', 5351401],
  ['dioc6', 'DiOC6(3)', 'dyes', '53213-82-4', 'C29H37IN2', 556.53, '', 6438302],
  ['jc1', 'JC-1', 'dyes', '3520-43-2', 'C25H27Cl4IN4', 652.23, '', 5492929],
  ['tmao', 'Trimethylamine N-oxide', 'biomolecules', '1184-78-7', 'C3H9NO', 75.11, '', 1145],
  ['creatinine', 'Creatinine', 'biomolecules', '60-27-5', 'C4H7N3O', 113.12, '', 588],
  ['bilirubin', 'Bilirubin', 'biomolecules', '635-65-4', 'C33H36N4O6', 584.66, '', 5280352],
  ['biliverdin', 'Biliverdin', 'biomolecules', '114-25-0', 'C33H34N4O6', 582.65, '', 5280353],
  ['heme-o', 'Heme O', 'porphyrins', '137397-56-9', 'C49H58N4O5Fe', 838.0, '', 5288528],
  ['pheophytin-a', 'Pheophytin a', 'porphyrins', '603-17-8', 'C55H74N4O5', 871.2, '', 135398661],
  ['bacteriopheophytin', 'Bacteriopheophytin a', 'porphyrins', '17453-58-6', 'C55H76N4O6', 889.22, '', 5479521],
  ['prochlorophyllide', 'Protochlorophyllide', 'porphyrins', '20369-67-9', 'C35H32N4O5Mg', 612.0, '', 5280683],
  ['hypericin', 'Hypericin', 'food', '548-04-9', 'C30H16O8', 504.44, '', 3663],
  ['emodin', 'Emodin', 'quinones', '518-82-1', 'C15H10O5', 270.24, '', 3220],
  ['plumbagin', 'Plumbagin', 'quinones', '481-42-5', 'C11H8O3', 188.18, '', 10205],
  ['menadione', 'Menadione', 'quinones', '58-27-5', 'C11H8O2', 172.18, '', 4055],
  ['coenzyme-q10', 'Coenzyme Q10', 'quinones', '303-98-0', 'C59H90O4', 863.34, '', 5281915],
  ['vitamin-k2', 'Menaquinone-4', 'quinones', '863-61-6', 'C31H40O2', 444.65, '', 5282367],
  ['lapachol', 'Lapachol', 'quinones', '84-79-7', 'C15H14O3', 242.27, '', 3884],
  ['shikonin', 'Shikonin', 'quinones', '517-89-5', 'C16H16O5', 288.3, '', 479503],
  ['lawsone-methyl', 'Lawsone methyl ether', 'quinones', '2348-82-5', 'C11H8O3', 188.18, '', 10212],
  ['naphthoquinone', '1,4-Naphthoquinone', 'quinones', '130-15-4', 'C10H6O2', 158.15, '', 8530],
  ['phenanthrenequinone', '9,10-Phenanthrenequinone', 'quinones', '84-11-7', 'C14H8O2', 208.21, '', 6763],
  ['acridone', 'Acridone', 'heterocycles', '578-95-0', 'C13H9NO', 195.22, '', 11357],
  ['xanthone', 'Xanthone', 'heterocycles', '90-47-1', 'C13H8O2', 196.2, '', 7020],
  ['flavone', 'Flavone', 'food', '525-82-6', 'C15H10O2', 222.24, '', 10680],
  ['quercetin', 'Quercetin', 'food', '117-39-5', 'C15H10O7', 302.24, '', 5280343],
  ['kaempferol', 'Kaempferol', 'food', '520-18-3', 'C15H10O6', 286.24, '', 5280863],
  ['resveratrol', 'Resveratrol', 'food', '501-36-0', 'C14H12O3', 228.24, '', 445154],
  ['genistein', 'Genistein', 'food', '446-72-0', 'C15H10O5', 270.24, '', 5280961],
  ['epicatechin', '(-)-Epicatechin', 'food', '490-46-0', 'C15H14O6', 290.27, '', 72276],
  ['egcg', 'EGCG', 'food', '989-51-5', 'C22H18O11', 458.37, '', 65064],
  ['theaflavin', 'Theaflavin', 'food', '4670-05-7', 'C29H24O12', 564.49, '', 114777],
  ['caffeine-citrate', 'Caffeine citrate', 'pharmaceuticals', '69-22-7', 'C14H18N4O9', 386.31, '', 6241],
  ['theobromine', 'Theobromine', 'pharmaceuticals', '83-67-0', 'C7H8N4O2', 180.16, '', 5429],
  ['theophylline', 'Theophylline', 'pharmaceuticals', '58-55-9', 'C7H8N4O2', 180.16, '', 2153],
  ['nicotinamide', 'Nicotinamide', 'biomolecules', '98-92-0', 'C6H6N2O', 122.12, '', 936],
  ['niacin', 'Niacin', 'biomolecules', '59-67-6', 'C6H5NO2', 123.11, '', 938],
  ['pyridoxine', 'Pyridoxine', 'biomolecules', '65-23-6', 'C8H11NO3', 169.18, '', 1054],
  ['biotin', 'Biotin', 'biomolecules', '58-85-5', 'C10H16N2O3S', 244.31, '', 171548],
  ['folic-acid', 'Folic acid', 'biomolecules', '59-30-3', 'C19H19N7O6', 441.4, '', 135398658],
  ['thiamine', 'Thiamine', 'biomolecules', '59-43-8', 'C12H17N4OS', 265.35, '', 1130],
  ['pantothenic-acid', 'Pantothenic acid', 'biomolecules', '79-83-4', 'C9H17NO5', 219.23, '', 6613],
  ['retinol', 'Retinol', 'biomolecules', '68-26-8', 'C20H30O', 286.45, '', 445354],
  ['retinoic-acid', 'Retinoic acid', 'biomolecules', '302-79-4', 'C20H28O2', 300.44, '', 444795],
  ['beta-ionone', 'β-Ionone', 'food', '79-77-6', 'C13H20O', 192.3, '', 638014],
  ['ionone-a', 'α-Ionone', 'food', '127-41-3', 'C13H20O', 192.3, '', 5282108],
  ['citral', 'Citral', 'food', '5392-40-5', 'C10H16O', 152.23, '', 638011],
  ['geraniol', 'Geraniol', 'food', '106-24-1', 'C10H18O', 154.25, '', 637566],
  ['linalool', 'Linalool', 'food', '78-70-6', 'C10H18O', 154.25, '', 6549],
  ['eugenol', 'Eugenol', 'food', '97-53-0', 'C10H12O2', 164.2, '', 3314],
  ['anethole', 'Anethole', 'food', '104-46-1', 'C10H12O', 148.2, '', 637563],
  ['safrole', 'Safrole', 'food', '94-59-7', 'C10H10O2', 162.19, '', 5144],
  ['piperine', 'Piperine', 'food', '94-62-2', 'C17H19NO3', 285.34, '', 638024],
  ['curcumin-demethoxy', 'Demethoxycurcumin', 'food', '22608-11-3', 'C20H18O5', 338.35, '', 5469424],
  ['bisdemethoxycurcumin', 'Bisdemethoxycurcumin', 'food', '24939-16-0', 'C19H16O4', 308.33, '', 5315472],
  ['tetrahydrocurcumin', 'Tetrahydrocurcumin', 'food', '36062-04-1', 'C21H24O6', 372.41, '', 124072],
  ['silymarin', 'Silybin', 'food', '22888-70-6', 'C25H22O10', 482.44, '', 31553],
  ['artemisinin', 'Artemisinin', 'pharmaceuticals', '63968-64-9', 'C15H22O5', 282.33, '', 68827],
  ['quinine-sulfate', 'Quinine sulfate', 'pharmaceuticals', '804-63-7', 'C40H50N4O8S', 746.91, '', 1065],
  ['chloroquine', 'Chloroquine', 'pharmaceuticals', '54-05-7', 'C18H26ClN3', 319.87, '', 2719],
  ['hydroxychloroquine', 'Hydroxychloroquine', 'pharmaceuticals', '118-42-3', 'C18H26ClN3O', 335.87, '', 3652],
  ['ivermectin', 'Ivermectin', 'pharmaceuticals', '70288-86-7', 'C48H74O14', 875.1, '', 6321424],
  ['azithromycin', 'Azithromycin', 'pharmaceuticals', '83905-01-5', 'C38H72N2O12', 748.98, '', 447043],
  ['amoxicillin', 'Amoxicillin', 'pharmaceuticals', '26787-78-0', 'C16H19N3O5S', 365.4, '', 33613],
  ['ciprofloxacin', 'Ciprofloxacin', 'pharmaceuticals', '85721-33-1', 'C17H18FN3O3', 331.34, '', 2764],
  ['tetracycline', 'Tetracycline', 'pharmaceuticals', '60-54-8', 'C22H24N2O8', 444.43, '', 54675776],
  ['doxycycline', 'Doxycycline', 'pharmaceuticals', '564-25-0', 'C22H24N2O8', 444.43, '', 54671203],
  ['rifampicin', 'Rifampicin', 'pharmaceuticals', '13292-46-1', 'C43H58N4O12', 822.94, '', 5381226],
  ['isoniazid', 'Isoniazid', 'pharmaceuticals', '54-85-3', 'C6H7N3O', 137.14, '', 3767],
  ['pyrazinamide', 'Pyrazinamide', 'pharmaceuticals', '98-96-4', 'C5H5N3O', 123.11, '', 1046],
  ['ethambutol', 'Ethambutol', 'pharmaceuticals', '74-55-5', 'C10H24N2O2', 204.31, '', 14052],
  ['oseltamivir', 'Oseltamivir', 'pharmaceuticals', '196618-13-0', 'C16H28N2O4', 312.4, '', 65028],
  ['remdesivir', 'Remdesivir', 'pharmaceuticals', '1809249-37-3', 'C27H35N6O8P', 602.58, '', 121304016],
  ['paxlovid-nirmatrelvir', 'Nirmatrelvir', 'pharmaceuticals', '2628280-40-8', 'C23H32F3N5O4', 499.53, '', 155903259],
  ['molnupiravir', 'Molnupiravir', 'pharmaceuticals', '2349386-89-4', 'C13H19N3O7', 329.31, '', 145996610],
  ['favipiravir', 'Favipiravir', 'pharmaceuticals', '259793-96-9', 'C5H4FN3O2', 157.1, '', 492405],
  ['tamoxifen', 'Tamoxifen', 'pharmaceuticals', '10540-29-1', 'C26H29NO', 371.51, '', 2733526],
  ['paclitaxel', 'Paclitaxel', 'pharmaceuticals', '33069-62-4', 'C47H51NO14', 853.91, '', 36314],
  ['docetaxel', 'Docetaxel', 'pharmaceuticals', '114977-28-5', 'C43H53NO14', 807.88, '', 148124],
  ['imatinib', 'Imatinib', 'pharmaceuticals', '152459-95-5', 'C29H31N7O', 493.6, '', 5291],
  ['gefitinib', 'Gefitinib', 'pharmaceuticals', '184475-35-2', 'C22H24ClFN4O3', 446.9, '', 123631],
  ['erlotinib', 'Erlotinib', 'pharmaceuticals', '183321-74-6', 'C22H23N3O4', 393.44, '', 176870],
  ['sunitinib', 'Sunitinib', 'pharmaceuticals', '557795-19-4', 'C22H27FN4O2', 398.47, '', 5329102],
  ['sorafenib', 'Sorafenib', 'pharmaceuticals', '284461-73-0', 'C21H16ClF3N4O3', 464.82, '', 216239],
  ['lenalidomide', 'Lenalidomide', 'pharmaceuticals', '191732-72-6', 'C13H13N3O3', 259.26, '', 216326],
  ['thalidomide', 'Thalidomide', 'pharmaceuticals', '50-35-1', 'C13H10N2O4', 258.23, '', 5426],
  ['methotrexate', 'Methotrexate', 'pharmaceuticals', '59-05-2', 'C20H22N8O5', 454.44, '', 126941],
  ['5-fluorouracil', '5-Fluorouracil', 'pharmaceuticals', '51-21-8', 'C4H3FN2O2', 130.08, '', 3385],
  ['gemcitabine', 'Gemcitabine', 'pharmaceuticals', '95058-81-4', 'C9H11F2N3O4', 263.2, '', 60750],
  ['cisplatin-alt', 'Carboplatin', 'pharmaceuticals', '41575-94-4', 'C6H12N2O4Pt', 371.25, '', 426756],
  ['oxaliplatin', 'Oxaliplatin', 'pharmaceuticals', '61825-94-3', 'C8H14N2O4Pt', 397.29, '', 5310940],
  ['cyclophosphamide', 'Cyclophosphamide', 'pharmaceuticals', '50-18-0', 'C7H15Cl2N2O2P', 261.09, '', 2907],
  ['ifosfamide', 'Ifosfamide', 'pharmaceuticals', '3778-73-2', 'C7H15Cl2N2O2P', 261.09, '', 3690],
  ['busulfan', 'Busulfan', 'pharmaceuticals', '55-98-1', 'C6H14O6S2', 246.3, '', 2478],
  ['melphalan', 'Melphalan', 'pharmaceuticals', '148-82-3', 'C13H18Cl2N2O2', 305.2, '', 460612],
  ['chlorambucil', 'Chlorambucil', 'pharmaceuticals', '305-03-3', 'C14H19Cl2NO2', 304.21, '', 2708],
  ['bendamustine', 'Bendamustine', 'pharmaceuticals', '16506-27-7', 'C16H21Cl2N3O2', 358.26, '', 65628],
  ['fludarabine', 'Fludarabine', 'pharmaceuticals', '21679-14-1', 'C10H12FN5O4', 285.23, '', 657237],
  ['cladribine', 'Cladribine', 'pharmaceuticals', '4291-63-8', 'C10H12ClN5O3', 285.69, '', 20279],
  ['cytarabine', 'Cytarabine', 'pharmaceuticals', '147-94-4', 'C9H13N3O5', 243.22, '', 6253],
  ['azacitidine', 'Azacitidine', 'pharmaceuticals', '320-67-2', 'C8H12N4O5', 244.2, '', 9444],
  ['decitabine', 'Decitabine', 'pharmaceuticals', '2353-33-5', 'C8H12N4O4', 228.21, '', 451668],
  ['venetoclax', 'Venetoclax', 'pharmaceuticals', '1257044-40-8', 'C45H50ClN7O7S', 868.44, '', 49846579],
  ['ibrutinib', 'Ibrutinib', 'pharmaceuticals', '936563-96-1', 'C25H24N6O2', 440.5, '', 24821094],
  ['ruxolitinib', 'Ruxolitinib', 'pharmaceuticals', '941678-49-5', 'C17H18N6', 306.37, '', 25126798],
  ['tofacitinib', 'Tofacitinib', 'pharmaceuticals', '477600-75-2', 'C16H20N6O', 312.37, '', 9926791],
  ['baricitinib', 'Baricitinib', 'pharmaceuticals', '1187594-09-7', 'C16H17N7O2S', 371.42, '', 44205240],
  ['upadacitinib', 'Upadacitinib', 'pharmaceuticals', '1310726-60-3', 'C17H19F3N6O', 380.37, '', 58557659],
  ['apixaban', 'Apixaban', 'pharmaceuticals', '503612-47-3', 'C25H25N5O4', 459.5, '', 10182969],
  ['rivaroxaban', 'Rivaroxaban', 'pharmaceuticals', '366789-02-8', 'C19H18ClN3O5S', 435.88, '', 9875401],
  ['dabigatran', 'Dabigatran', 'pharmaceuticals', '211914-51-1', 'C25H25N7O3', 471.51, '', 216210],
  ['heparin', 'Heparin (disaccharide unit)', 'biomolecules', '9005-49-6', 'C26H41NO34S4', 1039.9, '', 772],
  ['warfarin-sodium', 'Warfarin sodium', 'pharmaceuticals', '129-06-6', 'C19H15NaO4', 330.31, '', 54678486],
  ['enoxaparin', 'Enoxaparin', 'pharmaceuticals', '679809-58-6', 'C26H40N2O36S5', 1134.9, '', 772],
  ['insulin', 'Insulin (human)', 'biomolecules', '11061-68-0', 'C257H383N65O77S6', 5808.0, '', 118984375],
  ['glucagon', 'Glucagon', 'biomolecules', '16941-32-5', 'C153H225N43O49S', 3482.75, '', 16133812],
  ['epinephrine', 'Epinephrine', 'biomolecules', '51-43-4', 'C9H13NO3', 183.2, '', 5816],
  ['norepinephrine', 'Norepinephrine', 'biomolecules', '51-41-2', 'C8H11NO3', 169.18, '', 439260],
  ['histamine', 'Histamine', 'biomolecules', '51-45-6', 'C5H9N3', 111.15, '', 774],
  ['acetylcholine', 'Acetylcholine', 'biomolecules', '51-84-3', 'C7H16NO2', 146.21, '', 187],
  ['gaba', 'GABA', 'biomolecules', '56-12-2', 'C4H9NO2', 103.12, '', 119],
  ['glutamate', 'L-Glutamic acid', 'biomolecules', '56-86-0', 'C5H9NO4', 147.13, '', 33032],
  ['aspartate', 'L-Aspartic acid', 'biomolecules', '56-84-8', 'C4H7NO4', 133.1, '', 5960],
  ['lysine', 'L-Lysine', 'biomolecules', '56-87-1', 'C6H14N2O2', 146.19, '', 5962],
  ['arginine', 'L-Arginine', 'biomolecules', '74-79-3', 'C6H14N4O2', 174.2, '', 6322],
  ['cysteine', 'L-Cysteine', 'biomolecules', '52-90-4', 'C3H7NO2S', 121.16, '', 5862],
  ['methionine', 'L-Methionine', 'biomolecules', '63-68-3', 'C5H11NO2S', 149.21, '', 6137],
  ['proline', 'L-Proline', 'biomolecules', '147-85-3', 'C5H9NO2', 115.13, '', 145742],
  ['serine', 'L-Serine', 'biomolecules', '56-45-1', 'C3H7NO3', 105.09, '', 5951],
  ['threonine', 'L-Threonine', 'biomolecules', '72-19-5', 'C4H9NO3', 119.12, '', 6288],
  ['valine', 'L-Valine', 'biomolecules', '72-18-4', 'C5H11NO2', 117.15, '', 6287],
  ['leucine', 'L-Leucine', 'biomolecules', '61-90-5', 'C6H13NO2', 131.17, '', 6106],
  ['isoleucine', 'L-Isoleucine', 'biomolecules', '73-32-5', 'C6H13NO2', 131.17, '', 6306],
  ['alanine', 'L-Alanine', 'biomolecules', '56-41-7', 'C3H7NO2', 89.09, '', 5950],
  ['asparagine', 'L-Asparagine', 'biomolecules', '70-47-3', 'C4H8N2O3', 132.12, '', 6267],
  ['glutamine', 'L-Glutamine', 'biomolecules', '56-85-9', 'C5H10N2O3', 146.14, '', 5961],
  ['dmf', 'N,N-Dimethylformamide', 'solvents', '68-12-2', 'C3H7NO', 73.09, 'CN(C)C=O', 6228],
  ['acetonitrile', 'Acetonitrile', 'solvents', '75-05-8', 'C2H3N', 41.05, 'CC#N', 6342],
  ['thf', 'Tetrahydrofuran', 'solvents', '109-99-9', 'C4H8O', 72.11, 'C1CCOC1', 8028],
  ['dichloromethane', 'Dichloromethane', 'solvents', '75-09-2', 'CH2Cl2', 84.93, 'ClCCl', 6344],
  ['hexane', 'n-Hexane', 'solvents', '110-54-3', 'C6H14', 86.18, 'CCCCCC', 8058],
  ['cyclohexane', 'Cyclohexane', 'solvents', '110-82-7', 'C6H12', 84.16, 'C1CCCCC1', 8078],
  ['diethyl-ether', 'Diethyl ether', 'solvents', '60-29-7', 'C4H10O', 74.12, 'CCOCC', 3283],
  ['ethyl-acetate', 'Ethyl acetate', 'solvents', '141-78-6', 'C4H8O2', 88.11, 'CCOC(C)=O', 8857],
  ['isopropanol', 'Isopropanol', 'solvents', '67-63-0', 'C3H8O', 60.1, 'CC(C)O', 3776],
  ['t-butanol', 'tert-Butanol', 'solvents', '75-65-0', 'C4H10O', 74.12, 'CC(C)(C)O', 6386],
  ['dioxane', '1,4-Dioxane', 'solvents', '123-91-1', 'C4H8O2', 88.11, 'C1COCCO1', 31275],
  ['toluene-d8', 'Toluene-d8', 'solvents', '2037-26-5', 'C7D8', 100.19, '', 1140],
  ['heavy-water', 'Deuterium oxide', 'solvents', '7789-20-0', 'D2O', 20.03, '[2H]O[2H]', 24602],
  ['glycerol', 'Glycerol', 'solvents', '56-81-5', 'C3H8O3', 92.09, 'OCC(O)CO', 753],
  ['ethylene-glycol', 'Ethylene glycol', 'solvents', '107-21-1', 'C2H6O2', 62.07, 'OCCO', 174],
  ['formamide', 'Formamide', 'solvents', '75-12-7', 'CH3NO', 45.04, 'NC=O', 713],
  ['nmp', 'N-Methyl-2-pyrrolidone', 'solvents', '872-50-4', 'C5H9NO', 99.13, '', 13387],
  ['hmpa', 'HMPA', 'solvents', '680-31-9', 'C6H18N3OP', 179.2, '', 12679],
  ['pyridine-solvent', '2,6-Lutidine', 'solvents', '108-48-5', 'C7H9N', 107.15, '', 7937],
  ['triethylamine', 'Triethylamine', 'solvents', '121-44-8', 'C6H15N', 101.19, 'CCN(CC)CC', 8471],
  ['diisopropylethylamine', 'DIPEA', 'solvents', '7087-68-5', 'C8H19N', 129.24, '', 81531],
  ['tfa', 'Trifluoroacetic acid', 'solvents', '76-05-1', 'C2HF3O2', 114.02, 'OC(=O)C(F)(F)F', 6422],
  ['acetic-acid', 'Acetic acid', 'solvents', '64-19-7', 'C2H4O2', 60.05, 'CC(=O)O', 176],
  ['formic-acid', 'Formic acid', 'solvents', '64-18-6', 'CH2O2', 46.03, 'O=CO', 284],
  ['sulfuric-acid', 'Sulfuric acid', 'solvents', '7664-93-9', 'H2SO4', 98.08, 'OS(=O)(=O)O', 1118],
  ['hydrochloric-acid', 'Hydrochloric acid', 'solvents', '7647-01-0', 'HCl', 36.46, 'Cl', 313],
  ['sodium-hydroxide', 'Sodium hydroxide', 'solvents', '1310-73-2', 'HNaO', 40.0, '[OH-].[Na+]', 14798],
  ['ammonia', 'Ammonia', 'solvents', '7664-41-7', 'H3N', 17.03, 'N', 222],
  ['hydrogen-peroxide', 'Hydrogen peroxide', 'solvents', '7722-84-1', 'H2O2', 34.01, 'OO', 784],
  ['ozone', 'Ozone', 'solvents', '10028-15-6', 'O3', 48.0, '[O-][O+]=O', 24823],
  ['carbon-dioxide', 'Carbon dioxide', 'solvents', '124-38-9', 'CO2', 44.01, 'O=C=O', 280],
  ['carbon-monoxide', 'Carbon monoxide', 'solvents', '630-08-0', 'CO', 28.01, '[C-]#[O+]', 281],
  ['nitric-oxide', 'Nitric oxide', 'solvents', '10102-43-9', 'NO', 30.01, '[N]=O', 145068],
  ['nitrogen-dioxide', 'Nitrogen dioxide', 'solvents', '10102-44-0', 'NO2', 46.01, 'N(=O)[O]', 3032552],
  ['sulfur-dioxide', 'Sulfur dioxide', 'solvents', '7446-09-5', 'O2S', 64.07, 'O=S=O', 1119],
  ['hydrogen-sulfide', 'Hydrogen sulfide', 'solvents', '7783-06-4', 'H2S', 34.08, 'S', 402],
  ['methane', 'Methane', 'solvents', '74-82-8', 'CH4', 16.04, 'C', 297],
  ['ethane', 'Ethane', 'solvents', '74-84-0', 'C2H6', 30.07, 'CC', 6324],
  ['ethene', 'Ethene', 'solvents', '74-85-1', 'C2H4', 28.05, 'C=C', 6325],
  ['ethyne', 'Acetylene', 'solvents', '74-86-2', 'C2H2', 26.04, 'C#C', 6326],
  ['propane', 'Propane', 'solvents', '74-98-6', 'C3H8', 44.1, 'CCC', 6334],
  ['butane', 'n-Butane', 'solvents', '106-97-8', 'C4H10', 58.12, 'CCCC', 7843],
  ['isobutane', 'Isobutane', 'solvents', '75-28-5', 'C4H10', 58.12, 'CC(C)C', 6360],
  ['benzene-gas', 'Benzene (gas reference)', 'aromatic-hydrocarbons', '71-43-2', 'C6H6', 78.11, 'c1ccccc1', 241],
]

function attachVibrationalSpectra(compound) {
  const ir = buildIrSpectrum(compound.id, compound.family, compound.formula)
  const raman = buildRamanSpectrum(compound.id, compound.family)
  compound.spectra = [...(compound.spectra || []), ir, raman]
  compound.availability = {
    ...compound.availability,
    ir: true,
    raman: true,
  }
  if (compound.tier === 'catalog' && compound.spectra.some((s) => s.technique === 'uvvis_abs')) {
    compound.tier = 'full'
  }
  if (compound.tier === 'catalog') {
    compound.tier = 'partial'
    compound.plain_summary =
      compound.plain_summary ||
      `${compound.name}: searchable with teaching IR/Raman; UV–Vis curve may not be curated yet.`
  }
  return compound
}

function stubToEntry(row) {
  const [id, name, family, cas, formula, mw, smiles, cid] = row
  return attachVibrationalSpectra({
    id,
    name,
    synonyms: [],
    family,
    family_label: FAMILIES[family] || family,
    cas,
    formula,
    mw,
    smiles: smiles || '',
    pubchem_cid: cid,
    plain_summary: `${name} is in the searchable catalog with teaching IR/Raman. UV–Vis may not be curated yet.`,
    structure: { pubchem_3d: true },
    spectra: [],
    photophysics: {},
    availability: { uvvis_abs: false, fluorescence: false, ir: false, raman: false },
    tier: 'catalog',
  })
}

function buildFullCompound(c) {
  const spectra = []
  if (c.abs) {
    const raw = makeSpectrum(c.abs.peaks, c.abs.xMin, c.abs.xMax)
    const lit =
      c.abs.lit ||
      'Educational multi-Gaussian curve shaped to literature λmax / relative ε for teaching (not a raw instrument digitization).'
    spectra.push({
      id: `${c.id}-abs`,
      technique: 'uvvis_abs',
      kind: 'absorption',
      quality: 'teaching',
      solvent: c.abs.solvent,
      ...(c.abs.temperature_K != null ? { temperature_K: c.abs.temperature_K } : {}),
      y_unit: 'epsilon',
      y_unit_label: 'ε / M⁻¹ cm⁻¹',
      lambda_max_nm: c.abs.lambda_max_nm,
      epsilon_max: c.abs.epsilon_max,
      plain_caption: c.abs.plain_caption,
      display_points: downsample(raw),
      source: {
        citation: lit,
        license: 'CC-BY-4.0 packaging; verify experimental values against primary literature for research use.',
        note: c.abs.quality_note || 'Tier A teaching spectrum',
        ...(c.abs.doi ? { doi: c.abs.doi } : {}),
        ...(c.abs.url ? { url: c.abs.url } : {}),
      },
    })
  }
  if (c.em) {
    const raw = makeSpectrum(c.em.peaks, c.em.xMin, c.em.xMax)
    const maxY = Math.max(...raw.map((p) => p[1]), 1e-9)
    const norm = raw.map(([x, y]) => [x, Math.round((y / maxY) * 1000) / 1000])
    spectra.push({
      id: `${c.id}-em`,
      technique: 'fluorescence',
      kind: 'emission',
      quality: 'teaching',
      solvent: c.em.solvent,
      ...(c.em.temperature_K != null ? { temperature_K: c.em.temperature_K } : {}),
      y_unit: 'normalized',
      y_unit_label: 'Relative intensity',
      lambda_max_nm: c.em.lambda_max_nm,
      quantum_yield: c.em.quantum_yield,
      plain_caption: c.em.plain_caption,
      display_points: downsample(norm),
      source: {
        citation:
          c.em.lit ||
          'Educational emission envelope for teaching (normalized).',
        license: 'CC-BY-4.0 packaging',
        note: c.em.quality_note || 'Tier A teaching spectrum',
        ...(c.em.doi ? { doi: c.em.doi } : {}),
        ...(c.em.url ? { url: c.em.url } : {}),
      },
    })
  }

  return attachVibrationalSpectra({
    id: c.id,
    name: c.name,
    synonyms: c.synonyms || [],
    family: c.family,
    family_label: FAMILIES[c.family] || c.family,
    cas: c.cas,
    formula: c.formula,
    mw: c.mw,
    smiles: c.smiles,
    pubchem_cid: c.pubchem_cid,
    plain_summary: c.plain_summary,
    structure: { pubchem_3d: true },
    spectra,
    photophysics: {
      quantum_yield: c.em?.quantum_yield ?? null,
      quantum_yield_solvent: c.em?.solvent ?? null,
    },
    availability: {
      uvvis_abs: spectra.some((s) => s.technique === 'uvvis_abs'),
      fluorescence: spectra.some((s) => s.technique === 'fluorescence'),
      ir: false,
      raman: false,
    },
    tier: 'full',
  })
}

function isExperimentalSpectrum(s) {
  return s && s.quality === 'experimental' && !s.example_not_for_citation
}

function isExperimentalExampleSpectrum(s) {
  return s && s.quality === 'experimental' && !!s.example_not_for_citation
}

/** Build-time flags + class labels (dataset “API” contract for the UI). */
function attachBuildFlags(c) {
  const hasFullUvVis = c.spectra.some((s) => s.technique === 'uvvis_abs')
  const hasIr = c.spectra.some((s) => s.technique === 'ir')
  const hasRaman = c.spectra.some((s) => s.technique === 'raman')
  const hasFluorescence = c.spectra.some((s) => s.technique === 'fluorescence')
  c.availability = {
    uvvis_abs: hasFullUvVis,
    fluorescence: hasFluorescence,
    ir: hasIr,
    raman: hasRaman,
  }
  c.flags = {
    hasFullUvVis,
    hasIr,
    hasRaman,
    hasFluorescence,
  }
  // classLabels: family + lab class chips
  const classLabels = []
  if (c.family) classLabels.push(c.family)
  for (const lc of c.lab_classes || []) {
    if (!classLabels.includes(lc)) classLabels.push(lc)
  }
  c.class_labels = classLabels
  c.classLabels = classLabels
  c.labSet = !!c.lab_set
  if (c.pubchem_cid != null) c.pubchemCid = c.pubchem_cid
  // Ensure every spectrum has quality enum
  for (const s of c.spectra) {
    if (s.quality !== 'teaching' && s.quality !== 'experimental') {
      s.quality = 'teaching'
    }
  }
  c.tier = hasFullUvVis ? 'full' : c.tier === 'partial' ? 'partial' : 'catalog'
  return c
}

function toIndexEntry(c) {
  const abs =
    c.spectra.find((s) => s.technique === 'uvvis_abs' && isExperimentalSpectrum(s)) ||
    c.spectra.find((s) => s.technique === 'uvvis_abs')
  const hasFullUvVis = !!c.flags?.hasFullUvVis
  const hasIr = !!c.flags?.hasIr
  const hasRaman = !!c.flags?.hasRaman
  return {
    id: c.id,
    name: c.name,
    synonyms: c.synonyms || [],
    family: c.family,
    family_label: c.family_label,
    cas: c.cas,
    formula: c.formula,
    mw: c.mw,
    smiles: c.smiles || '',
    pubchem_cid: c.pubchem_cid,
    pubchemCid: c.pubchem_cid,
    tier: c.tier,
    // Build-computed flags (UI must not re-derive)
    has_uvvis: hasFullUvVis,
    hasFullUvVis,
    has_fluorescence: !!c.flags?.hasFluorescence,
    has_ir: hasIr,
    hasIr,
    has_raman: hasRaman,
    hasRaman,
    has_experimental: c.spectra.some(isExperimentalSpectrum),
    has_experimental_example: c.spectra.some(isExperimentalExampleSpectrum),
    lab_set: !!c.lab_set,
    labSet: !!c.lab_set,
    lab_classes: c.lab_classes || [],
    class_labels: c.class_labels || [],
    classLabels: c.classLabels || c.class_labels || [],
    tags: c.tags || [],
    lambda_max_nm: abs?.lambda_max_nm || [],
    solvents: [...new Set(c.spectra.map((s) => s.solvent).filter(Boolean))],
  }
}

/**
 * Merge open experimental series from data/experimental/*.json
 * (see docs/methodology.md). Never promotes teaching → experimental.
 */
function loadExperimentalOverlays() {
  const expDir = path.join(__dirname, '..', 'data', 'experimental')
  if (!fs.existsSync(expDir)) return []
  const files = fs
    .readdirSync(expDir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort()
  const overlays = []
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(expDir, file), 'utf8'))
    overlays.push({ file, ...raw })
  }
  return overlays
}

function applyExperimentalOverlay(allById, overlay) {
  const sid = overlay.compound_id || overlay.compound?.id
  if (!sid) throw new Error(`experimental overlay ${overlay.file}: missing compound_id`)
  let compound = allById.get(sid)
  if (!compound && overlay.create_if_missing && overlay.compound) {
    compound = {
      ...overlay.compound,
      id: sid,
      family_label: FAMILIES[overlay.compound.family] || overlay.compound.family_label || overlay.compound.family,
      structure: overlay.compound.structure || { pubchem_3d: true },
      spectra: [],
      photophysics: overlay.compound.photophysics || {},
      availability: {
        uvvis_abs: false,
        fluorescence: false,
        ir: false,
        raman: false,
      },
      tier: 'catalog',
    }
    compound = attachVibrationalSpectra(compound)
    allById.set(sid, compound)
  }
  if (!compound) {
    throw new Error(`experimental overlay ${overlay.file}: unknown compound_id ${sid}`)
  }

  const spectrum = overlay.spectrum
  if (!spectrum || spectrum.quality !== 'experimental') {
    throw new Error(
      `experimental overlay ${overlay.file}: spectrum.quality must be "experimental" (never relabel teaching)`,
    )
  }
  if (!spectrum.source?.citation) {
    throw new Error(`experimental overlay ${overlay.file}: source.citation required`)
  }
  if (!spectrum.source?.doi && !spectrum.source?.url) {
    throw new Error(`experimental overlay ${overlay.file}: source.doi or source.url required`)
  }
  if (!Array.isArray(spectrum.display_points) || spectrum.display_points.length < 5) {
    throw new Error(`experimental overlay ${overlay.file}: display_points must have ≥5 points`)
  }

  const built = {
    id: spectrum.id || `${sid}-${spectrum.technique || 'uvvis_abs'}-exp`,
    technique: spectrum.technique || 'uvvis_abs',
    kind: spectrum.kind || 'absorption',
    quality: 'experimental',
    ...(spectrum.example_not_for_citation ? { example_not_for_citation: true } : {}),
    solvent: spectrum.solvent,
    ...(spectrum.temperature_K != null ? { temperature_K: spectrum.temperature_K } : {}),
    y_unit: spectrum.y_unit || 'normalized',
    y_unit_label: spectrum.y_unit_label || 'Relative intensity',
    lambda_max_nm: spectrum.lambda_max_nm,
    epsilon_max: spectrum.epsilon_max,
    plain_caption: spectrum.plain_caption || 'Experimental series (see source).',
    display_points: spectrum.display_points,
    source: {
      citation: spectrum.source.citation,
      license: spectrum.source.license || 'see source',
      note: spectrum.source.note || (spectrum.example_not_for_citation ? 'example-not-for-citation' : 'experimental'),
      ...(spectrum.source.doi ? { doi: spectrum.source.doi } : {}),
      ...(spectrum.source.url ? { url: spectrum.source.url } : {}),
    },
  }

  // Prefer experimental UV–Vis as the primary abs series when present (keep teaching IR/Raman).
  if (built.technique === 'uvvis_abs') {
    compound.spectra = compound.spectra.filter((s) => s.technique !== 'uvvis_abs')
    compound.spectra.unshift(built)
  } else {
    compound.spectra = compound.spectra.filter((s) => s.id !== built.id)
    compound.spectra.push(built)
  }

  compound.availability = {
    uvvis_abs: compound.spectra.some((s) => s.technique === 'uvvis_abs'),
    fluorescence: compound.spectra.some((s) => s.technique === 'fluorescence'),
    ir: compound.spectra.some((s) => s.technique === 'ir'),
    raman: compound.spectra.some((s) => s.technique === 'raman'),
  }
  if (compound.availability.uvvis_abs) compound.tier = 'full'
  allById.set(sid, compound)
}

ensureDir(compoundsDir)

// UV teaching seeds live in data/uv-seeds/*.json (see docs/ADD_SPECTRUM.md)
const uvSeeds = loadUvSeedFiles()
if (!uvSeeds.length) {
  throw new Error('No UV seeds found in data/uv-seeds/ — expected teaching seed JSON files')
}
assertValidSeeds(uvSeeds, 'UV teaching seeds (data/uv-seeds)')
console.log(`  UV seeds: ${uvSeeds.length} from data/uv-seeds/`)

const fullCompounds = uvSeeds.map(buildFullCompound)
const stubCompounds = [...STUBS, ...EXTRA_STUBS].map(stubToEntry)

// Avoid duplicate ids if stub overlaps full
const fullIds = new Set(fullCompounds.map((c) => c.id))
const stubsFiltered = stubCompounds.filter((c) => !fullIds.has(c.id))
// de-dupe stubs by id
const seen = new Set()
const stubsUnique = []
for (const c of stubsFiltered) {
  if (seen.has(c.id)) continue
  seen.add(c.id)
  stubsUnique.push(c)
}

const allById = new Map()
for (const c of [...fullCompounds, ...stubsUnique]) allById.set(c.id, c)

const experimentalOverlays = loadExperimentalOverlays()
for (const ov of experimentalOverlays) applyExperimentalOverlay(allById, ov)

/**
 * Lab companion set — every id MUST have a full UV–Vis teaching curve.
 * Classes drive /lab quick chips (dyes | solvents | aromatics | porphyrins | biomolecules).
 */
const LAB_SET = {
  // Solvents / common blanks
  acetone: ['solvents'],
  // Simple aromatics + PAHs (UV discussion staples)
  benzene: ['aromatics'],
  toluene: ['aromatics'],
  phenol: ['aromatics'],
  aniline: ['aromatics'],
  nitrobenzene: ['aromatics'],
  styrene: ['aromatics'],
  biphenyl: ['aromatics'],
  ferrocene: ['aromatics'],
  naphthalene: ['aromatics'],
  anthracene: ['aromatics'],
  pyrene: ['aromatics'],
  phenanthrene: ['aromatics'],
  // UV dyes / fluorophores
  fluorescein: ['dyes'],
  'rhodamine-b': ['dyes'],
  'rhodamine-6g': ['dyes'],
  'methylene-blue': ['dyes'],
  'crystal-violet': ['dyes'],
  'eosin-y': ['dyes'],
  'malachite-green': ['dyes'],
  'coumarin-1': ['dyes'],
  'bodipy-fl': ['dyes'],
  dapi: ['dyes'],
  cy3: ['dyes'],
  indigo: ['dyes'],
  // Porphyrin-like
  'chlorophyll-a': ['porphyrins'],
  tetraphenylporphyrin: ['porphyrins'],
  'protoporphyrin-ix': ['porphyrins'],
  phthalocyanine: ['porphyrins'],
  // Biomolecules (lab teaching)
  tryptophan: ['biomolecules'],
  adenine: ['biomolecules'],
  thymine: ['biomolecules'],
  riboflavin: ['biomolecules'],
  nadh: ['biomolecules'],
  fad: ['biomolecules'],
}

// Tag compounds; fail loud if a lab id is missing or lacks UV
for (const [id, classes] of Object.entries(LAB_SET)) {
  const c = allById.get(id)
  if (!c) {
    throw new Error(`LAB_SET: unknown compound id "${id}"`)
  }
  if (!c.availability?.uvvis_abs) {
    throw new Error(`LAB_SET: "${id}" must have full UV–Vis teaching curve`)
  }
  c.lab_set = true
  c.lab_classes = classes
  c.tags = Array.from(new Set([...(c.tags || []), 'lab', ...classes]))
  allById.set(id, c)
}

// Finalize flags / classLabels on every record before write
const all = [...allById.values()].map(attachBuildFlags)
const labSetCount = all.filter((c) => c.lab_set).length

for (const c of all) {
  fs.writeFileSync(path.join(compoundsDir, `${c.id}.json`), JSON.stringify(c))
}

const withUv = all.filter((c) => c.flags.hasFullUvVis).length
const withIr = all.filter((c) => c.flags.hasIr).length
const withRaman = all.filter((c) => c.flags.hasRaman).length
const withExperimental = all.filter((c) => c.spectra.some(isExperimentalSpectrum)).length
const withExpExamples = all.filter((c) => c.spectra.some(isExperimentalExampleSpectrum)).length

/** App chrome defaults — keep in sync with ExplorerPage fallbacks. */
const APP_META = {
  // Visual teaching dye with full UV + emission (good first impression)
  default_compound_id: 'rhodamine-b',
  lab: {
    // Classic undergrad aromatic UV demo
    compound_id: 'benzene',
    technique: 'uvvis',
    lab_set_only: true,
    mode: 'simple',
  },
  lab_classes: [
    { id: 'dyes', label: 'UV dyes' },
    { id: 'solvents', label: 'Solvents' },
    { id: 'aromatics', label: 'Aromatics' },
    { id: 'porphyrins', label: 'Porphyrins' },
    { id: 'biomolecules', label: 'Biomolecules' },
  ],
}

const generatedAt = new Date().toISOString()
const catalogOnly = all.filter((c) => !c.flags.hasFullUvVis).length

const index = {
  version: '1.2.0',
  generated_at: generatedAt,
  generatedAt,
  app_meta: APP_META,
  counts: {
    total: all.length,
    full_spectra: withUv,
    full_uvvis: withUv,
    with_ir: withIr,
    with_raman: withRaman,
    ir: withIr,
    raman: withRaman,
    catalog_only: catalogOnly,
    experimental: withExperimental,
    experimental_examples: withExpExamples,
    lab_set: labSetCount,
  },
  families: Object.entries(FAMILIES).map(([id, label]) => ({
    id,
    label,
    count: all.filter((c) => c.family === id).length,
  })),
  compounds: all.map(toIndexEntry),
}

fs.writeFileSync(path.join(outRoot, 'index.json'), JSON.stringify(index))

// Machine-readable summary / lightweight “API” for About + CI
const summary = {
  version: index.version,
  total: all.length,
  full_uvvis: withUv,
  ir: withIr,
  raman: withRaman,
  lab_set: labSetCount,
  lab_set_count: labSetCount,
  catalog_only: catalogOnly,
  experimental: withExperimental,
  experimental_examples: withExpExamples,
  generatedAt,
  generated_at: generatedAt,
}
fs.writeFileSync(path.join(outRoot, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')

// Lightweight health probe for deploys / offline smoke (not required by UI)
const health = {
  version: index.version,
  full_uvvis: withUv,
  total: all.length,
  lab_set: labSetCount,
  generatedAt,
  ok: true,
}
const publicRoot = path.join(__dirname, '..', 'public')
fs.writeFileSync(path.join(publicRoot, 'health.json'), JSON.stringify(health, null, 2) + '\n')
// Also under dataset for assetUrl('dataset/...') consumers
fs.writeFileSync(path.join(outRoot, 'health.json'), JSON.stringify(health, null, 2) + '\n')

// Fail the build if any compound/index/summary violates schema
const validation = validateDatasetTree(outRoot)
if (!validation.ok) {
  console.error('Dataset schema validation FAILED:')
  for (const e of validation.errors.slice(0, 30)) console.error('  ·', e)
  if (validation.errors.length > 30) {
    console.error(`  … +${validation.errors.length - 30} more`)
  }
  process.exit(1)
}

console.log(
  `Dataset built: ${all.length} molecules (UV ${withUv}, IR ${withIr}, Raman ${withRaman}) → public/dataset/`,
)
console.log(`  full UV–Vis curves: ${withUv} (teaching + any experimental overlays)`)
console.log(`  lab set: ${labSetCount}`)
console.log(`  experimental (real): ${withExperimental}`)
console.log(`  experimental schema examples: ${withExpExamples}`)
console.log(`  catalog / IR–Raman only: ${catalogOnly}`)
console.log(`  schema validation: OK (${validation.stats.compoundsChecked} compounds)`)
