import type { BikeType, DriveType } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
//  Type definitions
// ─────────────────────────────────────────────────────────────────────────────

export type StrokeType = '2-stroke' | '4-stroke'
export type CylinderConfig =
  | 'single'
  | 'parallel-twin'
  | 'v-twin'
  | 'v-twin (45°)'
  | 'v-twin (60°)'
  | 'v-twin (90°)'
  | 'inline-3'
  | 'inline-4'
  | 'v4'
  | 'flat-twin'
  | 'flat-6'

export interface ModelInfo {
  name: string
  cc: number
  type: BikeType
  driveType: DriveType
  stroke: StrokeType
  cylinders: CylinderConfig
  yearFrom: number
  yearTo: number        // use new Date().getFullYear() for still-in-production
  color: string         // brand accent colour for placeholder
  imageUrl?: string     // manufacturer CDN — onError falls back to placeholder
}

export interface BrandInfo {
  name: string
  logoUrl: string       // Wikimedia Commons PNG
  logoFallback: string  // shown if logoUrl fails
  country: string
  color: string
  models: ModelInfo[]
}

const NOW = new Date().getFullYear()

// ─────────────────────────────────────────────────────────────────────────────
//  Brand catalogue
// ─────────────────────────────────────────────────────────────────────────────

export const BIKE_BRANDS: BrandInfo[] = [

  // ── YAMAHA ──────────────────────────────────────────────────────────────────
  {
    name: 'Yamaha',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Yamaha_logo.svg/200px-Yamaha_logo.svg.png',
    logoFallback: 'YMH',
    country: 'Japan',
    color: '#003087',
    models: [
      { name: 'NMAX 155',    cc: 155,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2015, yearTo: NOW,  color: '#003087', imageUrl: 'https://cdn.yamaha-motor.co.id/assets/images/products/nmax/2023/blue/main.png' },
      { name: 'Aerox 155',   cc: 155,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2016, yearTo: NOW,  color: '#003087', imageUrl: 'https://cdn.yamaha-motor.co.id/assets/images/products/aerox/2023/blue/main.png' },
      { name: 'Xmax 250',    cc: 250,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2017, yearTo: NOW,  color: '#003087', imageUrl: 'https://cdn.yamaha-motor.co.id/assets/images/products/xmax/2023/black/main.png' },
      { name: 'Lexi 125',    cc: 125,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2018, yearTo: NOW,  color: '#003087' },
      { name: 'MT-15',       cc: 155,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2018, yearTo: NOW,  color: '#003087', imageUrl: 'https://cdn.yamaha-motor.co.id/assets/images/products/mt15/2023/black/main.png' },
      { name: 'MT-25',       cc: 249,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2015, yearTo: NOW,  color: '#003087' },
      { name: 'MT-07',       cc: 689,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2014, yearTo: NOW,  color: '#003087' },
      { name: 'MT-09',       cc: 890,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-3',      yearFrom: 2014, yearTo: NOW,  color: '#003087' },
      { name: 'R15',         cc: 155,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2008, yearTo: NOW,  color: '#003087', imageUrl: 'https://cdn.yamaha-motor.co.id/assets/images/products/r15/2023/blue/main.png' },
      { name: 'R25',         cc: 249,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2014, yearTo: NOW,  color: '#003087' },
      { name: 'YZF-R1',      cc: 998,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1998, yearTo: NOW,  color: '#003087' },
      { name: 'YZF-R6',      cc: 599,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1999, yearTo: 2020, color: '#003087' },
      { name: 'XSR 155',     cc: 155,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2019, yearTo: NOW,  color: '#003087' },
      { name: 'Vixion R',    cc: 155,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2013, yearTo: NOW,  color: '#003087' },
      { name: 'WR 155R',     cc: 155,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',      yearFrom: 2019, yearTo: NOW,  color: '#003087' },
      { name: 'V-Max 1200',  cc: 1198, type: 'cruiser', driveType: 'shaft', stroke: '4-stroke', cylinders: 'v4',            yearFrom: 1985, yearTo: 2007, color: '#003087' },
      { name: 'SR 400',      cc: 399,  type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 1978, yearTo: 2021, color: '#003087' },
      // 2-stroke classics
      { name: 'RX-King 135', cc: 135,  type: 'naked',   driveType: 'chain', stroke: '2-stroke', cylinders: 'single',        yearFrom: 1980, yearTo: 2008, color: '#003087' },
      { name: 'RX 100',      cc: 100,  type: 'naked',   driveType: 'chain', stroke: '2-stroke', cylinders: 'single',        yearFrom: 1985, yearTo: 1996, color: '#003087' },
      { name: 'TZR 250',     cc: 249,  type: 'sport',   driveType: 'chain', stroke: '2-stroke', cylinders: 'parallel-twin', yearFrom: 1987, yearTo: 1999, color: '#003087' },
      { name: 'FZR 400',     cc: 399,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1987, yearTo: 1995, color: '#003087' },
      { name: 'XJR 400',     cc: 399,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1993, yearTo: 2008, color: '#003087' },
    ],
  },

  // ── HONDA ───────────────────────────────────────────────────────────────────
  {
    name: 'Honda',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Honda_Logo.svg/200px-Honda_Logo.svg.png',
    logoFallback: 'HND',
    country: 'Japan',
    color: '#CC0000',
    models: [
      { name: 'PCX 160',      cc: 160,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2021, yearTo: NOW,  color: '#CC0000', imageUrl: 'https://www.astra-honda.com/storage/products/July2022/pcx160.png' },
      { name: 'ADV 160',      cc: 160,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2022, yearTo: NOW,  color: '#CC0000', imageUrl: 'https://www.astra-honda.com/storage/products/July2022/adv160.png' },
      { name: 'Vario 160',    cc: 160,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2022, yearTo: NOW,  color: '#CC0000' },
      { name: 'Vario 125',    cc: 125,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2012, yearTo: NOW,  color: '#CC0000' },
      { name: 'BeAt',         cc: 110,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2008, yearTo: NOW,  color: '#CC0000' },
      { name: 'Scoopy',       cc: 110,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2010, yearTo: NOW,  color: '#CC0000' },
      { name: 'CB150R',       cc: 150,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2012, yearTo: NOW,  color: '#CC0000', imageUrl: 'https://www.astra-honda.com/storage/products/cb150r.png' },
      { name: 'CB500F',       cc: 471,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2013, yearTo: NOW,  color: '#CC0000' },
      { name: 'CBR250RR',     cc: 249,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2017, yearTo: NOW,  color: '#CC0000', imageUrl: 'https://www.astra-honda.com/storage/products/cbr250rr.png' },
      { name: 'CBR500R',      cc: 471,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2013, yearTo: NOW,  color: '#CC0000' },
      { name: 'CRF150L',      cc: 150,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',      yearFrom: 2017, yearTo: NOW,  color: '#CC0000' },
      { name: 'CRF250L',      cc: 250,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',      yearFrom: 2012, yearTo: NOW,  color: '#CC0000' },
      { name: 'Africa Twin',  cc: 1084, type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2015, yearTo: NOW, color: '#CC0000' },
      // Classics
      { name: 'NSR 250R',     cc: 249,  type: 'sport',   driveType: 'chain', stroke: '2-stroke', cylinders: 'v-twin (90°)',  yearFrom: 1988, yearTo: 1999, color: '#CC0000' },
      { name: 'NSR 150SP',    cc: 150,  type: 'sport',   driveType: 'chain', stroke: '2-stroke', cylinders: 'single',        yearFrom: 1992, yearTo: 2002, color: '#CC0000' },
      { name: 'CBR 900RR',    cc: 893,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1992, yearTo: 1999, color: '#CC0000' },
      { name: 'VFR 750',      cc: 748,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'v4',            yearFrom: 1986, yearTo: 1997, color: '#CC0000' },
      { name: 'CB 750',       cc: 736,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1969, yearTo: 2003, color: '#CC0000' },
      { name: 'GL Pro',       cc: 160,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 1991, yearTo: 2007, color: '#CC0000' },
      { name: 'Tiger 2000',   cc: 196,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 1993, yearTo: 2012, color: '#CC0000' },
      { name: 'Mega Pro',     cc: 166,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2000, yearTo: 2013, color: '#CC0000' },
      { name: 'CB 100',       cc: 99,   type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 1969, yearTo: 1982, color: '#CC0000' },
    ],
  },

  // ── KAWASAKI ─────────────────────────────────────────────────────────────────
  {
    name: 'Kawasaki',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Kawasaki_motorcycles_logo.svg/200px-Kawasaki_motorcycles_logo.svg.png',
    logoFallback: 'KWS',
    country: 'Japan',
    color: '#009900',
    models: [
      { name: 'KLX 150',      cc: 150,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2008, yearTo: NOW,  color: '#009900' },
      { name: 'KLX 230',      cc: 233,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2019, yearTo: NOW,  color: '#009900' },
      { name: 'KLX 300',      cc: 292,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2021, yearTo: NOW,  color: '#009900' },
      { name: 'W175',         cc: 177,  type: 'cruiser',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2017, yearTo: NOW,  color: '#009900' },
      { name: 'Ninja 250',    cc: 249,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2008, yearTo: NOW,  color: '#009900' },
      { name: 'Ninja ZX-25R', cc: 249,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 2020, yearTo: NOW,  color: '#009900' },
      { name: 'Ninja 400',    cc: 399,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2018, yearTo: NOW,  color: '#009900' },
      { name: 'Z250',         cc: 249,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2013, yearTo: NOW,  color: '#009900' },
      { name: 'Z400',         cc: 399,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2019, yearTo: NOW,  color: '#009900' },
      { name: 'Z900',         cc: 948,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 2017, yearTo: NOW,  color: '#009900' },
      { name: 'Versys 650',   cc: 649,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2006, yearTo: NOW,  color: '#009900' },
      // Classics
      { name: 'Ninja 150 RR', cc: 149,  type: 'sport',     driveType: 'chain', stroke: '2-stroke', cylinders: 'single',        yearFrom: 1994, yearTo: 2015, color: '#009900' },
      { name: 'Ninja 150 R',  cc: 149,  type: 'sport',     driveType: 'chain', stroke: '2-stroke', cylinders: 'single',        yearFrom: 2000, yearTo: 2015, color: '#009900' },
      { name: 'KR1S 250',     cc: 249,  type: 'sport',     driveType: 'chain', stroke: '2-stroke', cylinders: 'parallel-twin', yearFrom: 1989, yearTo: 1999, color: '#009900' },
      { name: 'ZXR 400',      cc: 398,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1989, yearTo: 2003, color: '#009900' },
      { name: 'ZX-7R',        cc: 748,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1989, yearTo: 2003, color: '#009900' },
      { name: 'GPZ 900R',     cc: 908,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1984, yearTo: 2003, color: '#009900' },
      { name: 'W650',         cc: 648,  type: 'cruiser',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 1999, yearTo: 2008, color: '#009900' },
      { name: 'Z1 900',       cc: 903,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1972, yearTo: 1977, color: '#009900' },
      { name: 'Eliminator 250', cc: 252, type: 'cruiser',  driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 1987, yearTo: 1997, color: '#009900' },
    ],
  },

  // ── SUZUKI ──────────────────────────────────────────────────────────────────
  {
    name: 'Suzuki',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Suzuki_logo_2.svg/200px-Suzuki_logo_2.svg.png',
    logoFallback: 'SZK',
    country: 'Japan',
    color: '#004B98',
    models: [
      // Current
      { name: 'GSX-R150',       cc: 150,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2017, yearTo: NOW,  color: '#004B98' },
      { name: 'GSX-S150',       cc: 150,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2017, yearTo: NOW,  color: '#004B98' },
      { name: 'GSX-R1000',      cc: 999,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 2001, yearTo: NOW,  color: '#004B98' },
      { name: 'V-Strom 250',    cc: 248,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2017, yearTo: NOW,  color: '#004B98' },
      { name: 'V-Strom 650',    cc: 645,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (90°)',  yearFrom: 2002, yearTo: NOW,  color: '#004B98' },
      { name: 'Burgman 125',    cc: 125,  type: 'matic',     driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 1998, yearTo: NOW,  color: '#004B98' },
      { name: 'Address 110',    cc: 113,  type: 'matic',     driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2014, yearTo: NOW,  color: '#004B98' },
      { name: 'Satria F150',    cc: 147,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2005, yearTo: NOW,  color: '#004B98' },
      // Classics ← user's Bandit is here
      { name: 'Bandit GSF 400', cc: 398,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1989, yearTo: 1997, color: '#004B98' },
      { name: 'Bandit GSF 600', cc: 599,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1994, yearTo: 2005, color: '#004B98' },
      { name: 'Bandit GSF 1200', cc: 1157, type: 'naked',    driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1995, yearTo: 2006, color: '#004B98' },
      { name: 'GSX-R 400',      cc: 398,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1984, yearTo: 1999, color: '#004B98' },
      { name: 'GSX-R 750',      cc: 749,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1985, yearTo: NOW,  color: '#004B98' },
      { name: 'RGV 250 Gamma',  cc: 249,  type: 'sport',     driveType: 'chain', stroke: '2-stroke', cylinders: 'v-twin (90°)', yearFrom: 1988, yearTo: 1996, color: '#004B98' },
      { name: 'Katana GSX 600F', cc: 599, type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1988, yearTo: 2006, color: '#004B98' },
      { name: 'Katana GSX 750F', cc: 748, type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1989, yearTo: 2006, color: '#004B98' },
      { name: 'Thunder 250',    cc: 249,  type: 'cruiser',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2002, yearTo: 2009, color: '#004B98' },
      { name: 'Thunder 125',    cc: 124,  type: 'cruiser',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2001, yearTo: 2010, color: '#004B98' },
      { name: 'GT 750',         cc: 739,  type: 'touring',   driveType: 'chain', stroke: '2-stroke', cylinders: 'inline-3',      yearFrom: 1971, yearTo: 1977, color: '#004B98' },
      { name: 'GS 750',         cc: 748,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1976, yearTo: 1983, color: '#004B98' },
      { name: 'Smash 110',      cc: 110,  type: 'matic',     driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2002, yearTo: 2018, color: '#004B98' },
    ],
  },

  // ── ROYAL ENFIELD ────────────────────────────────────────────────────────────
  {
    name: 'Royal Enfield',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Royal_Enfield_logo.svg/200px-Royal_Enfield_logo.svg.png',
    logoFallback: 'RE',
    country: 'India',
    color: '#8B1A1A',
    models: [
      { name: 'Classic 350',        cc: 349, type: 'cruiser',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2009, yearTo: NOW,  color: '#8B1A1A' },
      { name: 'Meteor 350',         cc: 349, type: 'cruiser',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2020, yearTo: NOW,  color: '#8B1A1A' },
      { name: 'Himalayan',          cc: 411, type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2016, yearTo: NOW,  color: '#8B1A1A' },
      { name: 'Bullet 350',         cc: 346, type: 'cruiser',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 1955, yearTo: NOW,  color: '#8B1A1A' },
      { name: 'Interceptor 650',    cc: 648, type: 'cruiser',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2018, yearTo: NOW,  color: '#8B1A1A' },
      { name: 'Continental GT 650', cc: 648, type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2018, yearTo: NOW,  color: '#8B1A1A' },
      { name: 'Thunderbird 350',    cc: 346, type: 'touring',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2002, yearTo: 2019, color: '#8B1A1A' },
    ],
  },

  // ── KTM ─────────────────────────────────────────────────────────────────────
  {
    name: 'KTM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/KTM_Sportmotorcycle_AG_%28Logo%29.svg/200px-KTM_Sportmotorcycle_AG_%28Logo%29.svg.png',
    logoFallback: 'KTM',
    country: 'Austria',
    color: '#FF6600',
    models: [
      { name: 'Duke 125',       cc: 125, type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2011, yearTo: NOW,  color: '#FF6600' },
      { name: 'Duke 200',       cc: 200, type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2012, yearTo: NOW,  color: '#FF6600' },
      { name: 'Duke 390',       cc: 373, type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2013, yearTo: NOW,  color: '#FF6600' },
      { name: 'RC 200',         cc: 200, type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2014, yearTo: NOW,  color: '#FF6600' },
      { name: 'RC 390',         cc: 373, type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2014, yearTo: NOW,  color: '#FF6600' },
      { name: 'Adventure 390',  cc: 373, type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2020, yearTo: NOW,  color: '#FF6600' },
      { name: '690 Duke',       cc: 693, type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2008, yearTo: NOW,  color: '#FF6600' },
    ],
  },

  // ── VESPA ───────────────────────────────────────────────────────────────────
  {
    name: 'Vespa',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Vespa_logo.svg/200px-Vespa_logo.svg.png',
    logoFallback: 'VSP',
    country: 'Italy',
    color: '#5C2D91',
    models: [
      { name: 'Sprint 150',    cc: 154, type: 'matic', driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single', yearFrom: 2013, yearTo: NOW,  color: '#5C2D91' },
      { name: 'Primavera 150', cc: 154, type: 'matic', driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single', yearFrom: 2013, yearTo: NOW,  color: '#5C2D91' },
      { name: 'GTS 300',       cc: 278, type: 'matic', driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single', yearFrom: 2002, yearTo: NOW,  color: '#5C2D91' },
      { name: 'GTV 150',       cc: 154, type: 'matic', driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single', yearFrom: 2006, yearTo: NOW,  color: '#5C2D91' },
      { name: 'LX 125',        cc: 124, type: 'matic', driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single', yearFrom: 2005, yearTo: NOW,  color: '#5C2D91' },
      { name: 'PX 150',        cc: 150, type: 'matic', driveType: 'vbelt', stroke: '2-stroke', cylinders: 'single', yearFrom: 1978, yearTo: 2018, color: '#5C2D91' },
      { name: 'P125X',         cc: 123, type: 'matic', driveType: 'vbelt', stroke: '2-stroke', cylinders: 'single', yearFrom: 1977, yearTo: 1990, color: '#5C2D91' },
      { name: 'GL 150',        cc: 145, type: 'matic', driveType: 'vbelt', stroke: '2-stroke', cylinders: 'single', yearFrom: 1962, yearTo: 1965, color: '#5C2D91' },
    ],
  },

  // ── HARLEY-DAVIDSON ──────────────────────────────────────────────────────────
  {
    name: 'Harley-Davidson',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Harley-Davidson_logo.svg/200px-Harley-Davidson_logo.svg.png',
    logoFallback: 'H-D',
    country: 'USA',
    color: '#FF6600',
    models: [
      // Modern
      { name: 'Nightster 975',    cc: 975,  type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (60°)',   yearFrom: 2022, yearTo: NOW,  color: '#FF6600' },
      { name: 'Sportster S',      cc: 1252, type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (60°)',   yearFrom: 2021, yearTo: NOW,  color: '#FF6600' },
      { name: 'Fat Bob 114',      cc: 1868, type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (45°)',   yearFrom: 2018, yearTo: NOW,  color: '#FF6600' },
      { name: 'Street Glide',     cc: 1868, type: 'touring', driveType: 'shaft', stroke: '4-stroke', cylinders: 'v-twin (45°)',   yearFrom: 2006, yearTo: NOW,  color: '#FF6600' },
      { name: 'Road King',        cc: 1868, type: 'touring', driveType: 'shaft', stroke: '4-stroke', cylinders: 'v-twin (45°)',   yearFrom: 1994, yearTo: NOW,  color: '#FF6600' },
      { name: 'Fat Boy',          cc: 1690, type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (45°)',   yearFrom: 1990, yearTo: NOW,  color: '#FF6600' },
      // Classics
      { name: 'Sportster 1200',   cc: 1200, type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (45°)',   yearFrom: 1988, yearTo: 2020, color: '#FF6600' },
      { name: 'Sportster 883',    cc: 883,  type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (45°)',   yearFrom: 1986, yearTo: 2020, color: '#FF6600' },
      { name: 'Iron 883',         cc: 883,  type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (45°)',   yearFrom: 2009, yearTo: 2022, color: '#FF6600' },
      { name: 'FXLR Low Rider',   cc: 1340, type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (45°)',   yearFrom: 1987, yearTo: 1994, color: '#FF6600' },
      { name: 'Knucklehead',      cc: 1200, type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (45°)',   yearFrom: 1936, yearTo: 1947, color: '#FF6600' },
    ],
  },

  // ── BMW MOTORRAD ─────────────────────────────────────────────────────────────
  {
    name: 'BMW Motorrad',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/200px-BMW.svg.png',
    logoFallback: 'BMW',
    country: 'Germany',
    color: '#1C69D4',
    models: [
      { name: 'G 310 R',      cc: 313,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2016, yearTo: NOW,  color: '#1C69D4' },
      { name: 'G 310 GS',     cc: 313,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2017, yearTo: NOW,  color: '#1C69D4' },
      { name: 'S 1000 RR',    cc: 999,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 2009, yearTo: NOW,  color: '#1C69D4' },
      { name: 'S 1000 R',     cc: 999,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 2014, yearTo: NOW,  color: '#1C69D4' },
      { name: 'F 900 GS',     cc: 895,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2023, yearTo: NOW,  color: '#1C69D4' },
      { name: 'F 800 GS',     cc: 798,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2008, yearTo: 2018, color: '#1C69D4' },
      { name: 'R 1250 GS',    cc: 1254, type: 'adventure', driveType: 'shaft', stroke: '4-stroke', cylinders: 'flat-twin',     yearFrom: 2018, yearTo: NOW,  color: '#1C69D4' },
      { name: 'R 1200 GS',    cc: 1169, type: 'adventure', driveType: 'shaft', stroke: '4-stroke', cylinders: 'flat-twin',     yearFrom: 2004, yearTo: 2018, color: '#1C69D4' },
      { name: 'R 80',         cc: 797,  type: 'touring',   driveType: 'shaft', stroke: '4-stroke', cylinders: 'flat-twin',     yearFrom: 1976, yearTo: 1995, color: '#1C69D4' },
      { name: 'R 100 RS',     cc: 980,  type: 'touring',   driveType: 'shaft', stroke: '4-stroke', cylinders: 'flat-twin',     yearFrom: 1976, yearTo: 1992, color: '#1C69D4' },
      { name: 'R 75',         cc: 750,  type: 'naked',     driveType: 'shaft', stroke: '4-stroke', cylinders: 'flat-twin',     yearFrom: 1941, yearTo: 1973, color: '#1C69D4' },
    ],
  },

  // ── DUCATI ───────────────────────────────────────────────────────────────────
  {
    name: 'Ducati',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Ducati_Corse_logo.svg/200px-Ducati_Corse_logo.svg.png',
    logoFallback: 'DCT',
    country: 'Italy',
    color: '#CC0000',
    models: [
      { name: 'Monster 937',     cc: 937,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (90°)',  yearFrom: 2021, yearTo: NOW,  color: '#CC0000' },
      { name: 'Monster 821',     cc: 821,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (90°)',  yearFrom: 2014, yearTo: 2020, color: '#CC0000' },
      { name: 'Monster M900',    cc: 904,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (90°)',  yearFrom: 1993, yearTo: 1999, color: '#CC0000' },
      { name: 'Panigale V2',     cc: 955,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (90°)',  yearFrom: 2020, yearTo: NOW,  color: '#CC0000' },
      { name: 'Panigale V4',     cc: 1103, type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v4',            yearFrom: 2018, yearTo: NOW,  color: '#CC0000' },
      { name: 'Scrambler 800',   cc: 803,  type: 'cruiser',   driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (90°)',  yearFrom: 2015, yearTo: NOW,  color: '#CC0000' },
      { name: 'Multistrada V4',  cc: 1158, type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'v4',            yearFrom: 2021, yearTo: NOW,  color: '#CC0000' },
      { name: '916',             cc: 916,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (90°)',  yearFrom: 1994, yearTo: 1998, color: '#CC0000' },
      { name: '748',             cc: 748,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (90°)',  yearFrom: 1995, yearTo: 2002, color: '#CC0000' },
    ],
  },

  // ── TRIUMPH ──────────────────────────────────────────────────────────────────
  {
    name: 'Triumph',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Triumph_Motorcycles_logo.svg/200px-Triumph_Motorcycles_logo.svg.png',
    logoFallback: 'TRP',
    country: 'UK',
    color: '#C41E3A',
    models: [
      { name: 'Street Triple 765', cc: 765,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-3',      yearFrom: 2017, yearTo: NOW,  color: '#C41E3A' },
      { name: 'Speed Triple 1200', cc: 1160, type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-3',      yearFrom: 2021, yearTo: NOW,  color: '#C41E3A' },
      { name: 'Bonneville T120',   cc: 1200, type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2016, yearTo: NOW,  color: '#C41E3A' },
      { name: 'Bonneville T100',   cc: 900,  type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2001, yearTo: NOW,  color: '#C41E3A' },
      { name: 'Tiger 900',         cc: 888,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-3',    yearFrom: 2020, yearTo: NOW,  color: '#C41E3A' },
      { name: 'Thruxton 1200',     cc: 1200, type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2016, yearTo: NOW,  color: '#C41E3A' },
      { name: 'Bonneville (classic)', cc: 649, type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 1959, yearTo: 1988, color: '#C41E3A' },
    ],
  },

]

// ─────────────────────────────────────────────────────────────────────────────
//  Consumables
// ─────────────────────────────────────────────────────────────────────────────

export const OIL_BRANDS = [
  'Yamalube', 'Honda Genuine Oil', 'Kawasaki Genuine', 'Suzuki Genuine',
  'Castrol', 'Shell Advance', 'Motul', 'Repsol',
  'Liqui-Moly', 'Mobil 1', 'Fuchs Silkolene', 'Valvoline', 'Bel-Ray',
  'Motorex', 'Petronas Syntium', 'Total Quartz', 'Pertamina Fastron',
  'Agip / Eni', 'Ipone', 'Putoline',
]

export const OIL_SAE_GRADES = [
  '5W-30', '5W-40', '10W-30', '10W-40', '10W-50',
  '15W-40', '15W-50', '20W-40', '20W-50',
]

export const TIRE_BRANDS = [
  'IRC', 'FDR', 'Battlax (Bridgestone)', 'Pilot Road (Michelin)',
  'Dunlop', 'Metzeler', 'Continental', 'Pirelli',
  'Maxxis', 'Swallow', 'Aspira (Corsa)', 'Zeneos', 'Eurogrip',
  'Shinko', 'Avon', 'BT-39 (Bridgestone)', 'Karoo (Metzeler)',
]

export const DRIVE_BRANDS: Record<'vbelt' | 'chain' | 'shaft', string[]> = {
  vbelt: [
    'Yamaha Genuine', 'Honda Genuine', 'Suzuki Genuine',
    'Bando', 'Gates', 'Dayco', 'Otoparts', 'TDR', 'WRX', 'Kitaco',
  ],
  chain: [
    'DID', 'RK Chain', 'EK Chain', 'Regina', 'Tsubaki',
    'Izumi', 'Daido', 'JT Sprockets', 'Honda Genuine', 'Yamaha Genuine',
  ],
  shaft: ['OEM Shaft Drive'],
}
