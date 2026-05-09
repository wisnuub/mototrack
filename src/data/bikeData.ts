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
  logoUrl: string       // local /brands/ svg file
  logoFallback: string  // text shown if img fails
  country: string
  color: string
  models: ModelInfo[]        // detailed entries with specs (auto-fill)
  modelCatalog?: string[]    // full name list from motorcyclespecs.co.za
}

const NOW = new Date().getFullYear()

// ─────────────────────────────────────────────────────────────────────────────
//  Brand catalogue
// ─────────────────────────────────────────────────────────────────────────────

export const BIKE_BRANDS: BrandInfo[] = [

  // ── YAMAHA ──────────────────────────────────────────────────────────────────
  {
    name: 'Yamaha',
    logoUrl: '/brands/yamaha.svg',
    logoFallback: 'YMH',
    country: 'Japan',
    color: '#003087',
    models: [
      // ── Maxi ──
      { name: 'TMAX',          cc: 562,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2001, yearTo: NOW,  color: '#003087' },
      { name: 'XMAX 250',      cc: 250,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2017, yearTo: NOW,  color: '#003087' },
      { name: 'NMAX Turbo',    cc: 155,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2024, yearTo: NOW,  color: '#003087' },
      { name: 'NMAX 155',      cc: 155,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2015, yearTo: NOW,  color: '#003087' },
      { name: 'Aerox Alpha',   cc: 155,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2024, yearTo: NOW,  color: '#003087' },
      { name: 'Aerox 155',     cc: 155,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2016, yearTo: NOW,  color: '#003087' },
      { name: 'LEXi LX 155',   cc: 155,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2018, yearTo: NOW,  color: '#003087' },
      // ── Classy ──
      { name: 'Grand Filano',  cc: 125,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2015, yearTo: NOW,  color: '#003087' },
      { name: 'Fazzio',        cc: 125,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2022, yearTo: NOW,  color: '#003087' },
      // ── Matic ──
      { name: 'Gear Ultima',   cc: 125,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2024, yearTo: NOW,  color: '#003087' },
      { name: 'GEAR 125',      cc: 125,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2019, yearTo: NOW,  color: '#003087' },
      { name: 'FreeGo 125',    cc: 125,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2018, yearTo: NOW,  color: '#003087' },
      { name: 'X-Ride 125',    cc: 125,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2012, yearTo: NOW,  color: '#003087' },
      { name: 'Mio M3 125',    cc: 125,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2013, yearTo: NOW,  color: '#003087' },
      { name: 'Fino 125',      cc: 125,  type: 'matic',   driveType: 'vbelt', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2012, yearTo: NOW,  color: '#003087' },
      // ── Sport / Naked ──
      { name: 'XSR 155',       cc: 155,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2019, yearTo: NOW,  color: '#003087' },
      { name: 'R15',           cc: 155,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2008, yearTo: NOW,  color: '#003087' },
      { name: 'R25',           cc: 249,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2014, yearTo: NOW,  color: '#003087' },
      { name: 'MT-25',         cc: 249,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2015, yearTo: NOW,  color: '#003087' },
      { name: 'MT-15',         cc: 155,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2018, yearTo: NOW,  color: '#003087' },
      { name: 'Vixion 155',    cc: 155,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2013, yearTo: NOW,  color: '#003087' },
      { name: 'MT-07',         cc: 689,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2014, yearTo: NOW,  color: '#003087' },
      { name: 'MT-09',         cc: 890,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-3',      yearFrom: 2014, yearTo: NOW,  color: '#003087' },
      { name: 'R7',            cc: 689,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2021, yearTo: NOW,  color: '#003087' },
      { name: 'YZF-R1',        cc: 998,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1998, yearTo: NOW,  color: '#003087' },
      { name: 'YZF-R6',        cc: 599,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1999, yearTo: 2020, color: '#003087' },
      // ── Off-Road ──
      { name: 'WR155R',        cc: 155,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',      yearFrom: 2019, yearTo: NOW,  color: '#003087' },
      { name: 'YZ125X',        cc: 125,  type: 'adventure', driveType: 'chain', stroke: '2-stroke', cylinders: 'single',      yearFrom: 2020, yearTo: NOW,  color: '#003087' },
      { name: 'YZ250X',        cc: 250,  type: 'adventure', driveType: 'chain', stroke: '2-stroke', cylinders: 'single',      yearFrom: 2016, yearTo: NOW,  color: '#003087' },
      { name: 'YZ250F',        cc: 250,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',      yearFrom: 2001, yearTo: NOW,  color: '#003087' },
      { name: 'YZ250FX',       cc: 250,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',      yearFrom: 2015, yearTo: NOW,  color: '#003087' },
      // ── Moped ──
      { name: 'MX King 150',   cc: 150,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2015, yearTo: NOW,  color: '#003087' },
      { name: 'Jupiter Z1',    cc: 115,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2010, yearTo: NOW,  color: '#003087' },
      { name: 'Vega Force',    cc: 115,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2012, yearTo: NOW,  color: '#003087' },
      // ── Classics ──
      { name: 'V-Max 1200',    cc: 1198, type: 'cruiser', driveType: 'shaft', stroke: '4-stroke', cylinders: 'v4',            yearFrom: 1985, yearTo: 2007, color: '#003087' },
      { name: 'SR 400',        cc: 399,  type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 1978, yearTo: 2021, color: '#003087' },
      { name: 'RX-King 135',   cc: 135,  type: 'naked',   driveType: 'chain', stroke: '2-stroke', cylinders: 'single',        yearFrom: 1980, yearTo: 2008, color: '#003087' },
      { name: 'RX 100',        cc: 100,  type: 'naked',   driveType: 'chain', stroke: '2-stroke', cylinders: 'single',        yearFrom: 1985, yearTo: 1996, color: '#003087' },
      { name: 'TZR 250',       cc: 249,  type: 'sport',   driveType: 'chain', stroke: '2-stroke', cylinders: 'parallel-twin', yearFrom: 1987, yearTo: 1999, color: '#003087' },
      { name: 'FZR 400',       cc: 399,  type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1987, yearTo: 1995, color: '#003087' },
      { name: 'XJR 400',       cc: 399,  type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1993, yearTo: 2008, color: '#003087' },
    ],
    modelCatalog: ["Aerox 155","Aerox Alpha","AG 100","AG 175","AG 200","AX 125","BT1100 Bulldog","CS 200","DT 125","DT 125E","DT 125MX","DT 125LC","DT 125R","DT 125RE","DT 125X","DT 175","DT 200R","DT 200WR","DT 230 Lanza","DT-1 250","DT 250","DT 360A","DT 400","Exciter 150","Fazzio","Fino 125","FJ 1100","FJ 1200","FJR 1300","FreeGo 125","FZ 400","FZ 600","FZ 750","FZR 1000","FZS 600 Fazer","FZS 1000 Fazer","GEAR 125","Gear Ultima","Grand Filano","Jupiter Z1","LEXi LX 155","Mio M3 125","Mio Soul GT","MT-01","MT-03","MT-07","MT-09","MT-09 SP","MT-09 Tracer","MT-10","MT-10 SP","MT-15","MT-25","MT-125","MX King 150","NMAX 125","NMAX 155","NMAX Turbo","R1-M","R3","R6S","R7","R15","R25","RD 125","RD 250","RD 350","RD 500","RX-King 135","RX 100","SR 400","SR 500","SRX 400","SRX 600","T-Max 500","T-Max 530","T-Max 560","TDM 850","TDM 900","TDR 125","TDR 250","TMAX","TRX 850","TT 350","TT 600","TW 125","TW 200","TZR 250","V-Max 1200","Vega Force","Vixion 155","Vmax 1700","WR 125","WR155R","WR 250","WR 450","XMAX 250","XC 125","XJ 600","XJ 900","XJR 1200","XJR 1300","XJR 400","XP 500 T-Max","XS 400","XS 500","XS 650","XS 750","XS 850","XS 1100","XSR 155","XT 125","XT 225","XT 350","XT 500","XT 550","XT 600","XT 660","XT 750","XTZ 660 Tenere","XV 125","XV 250","XV 535","XV 750","XV 920","XV 1000","XV 1100","XV 1700 Road Star","XVS 650","XVS 950","XVS 1100","XVZ 1300","X-Ride 125","YZF-R1","YZF-R6","YZF-R125","YZF 600","YZF 750","YZ125X","YZ250X","YZ250F","YZ250FX"],
  },

  // ── HONDA ───────────────────────────────────────────────────────────────────
  {
    name: 'Honda',
    logoUrl: '/brands/honda.svg',
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
    modelCatalog: ["ADV 150","ADV 160","ADV 350","AX-1","C50 Super Cub","C90 Super Cub","C125 Super Cub","CA 125 Rebel","CB 125F","CB 125R","CB 150R","CB 200X","CB 250R","CB 300R","CB 400","CB 400F","CB 400 Super Four","CB 400SF","CB 500F","CB 500X","CB 650F","CB 650R","CB 750","CB 900F","CB 1000R","CB 1100","CB 1300","CBF 125","CBF 600","CBF 1000","CBR 125R","CBR 250R","CBR 250RR","CBR 300R","CBR 500R","CBR 600F","CBR 600RR","CBR 900RR","CBR 954RR","CBR 1000RR","CBR 1000RR-R","CRF 150L","CRF 250L","CRF 300L","CRF 450L","CRF 1100 Africa Twin","CRF 1000 Africa Twin","CTX 700","Forza 125","Forza 250","Forza 300","Forza 350","GL 1200 Gold Wing","GL 1500 Gold Wing","GL 1800 Gold Wing","Hornet 600","Hornet 900","NC 700S","NC 750S","NC 750X","NSR 150SP","NSR 250R","NT 1100","PCX 125","PCX 150","PCX 160","SH 125","SH 150","SH 300","Scoopy","Shadow VT 600","Shadow VT 750","Transalp 600","Transalp 700","VFR 400","VFR 750","VFR 800","VFR 1200F","VTR 250","VTR 1000F Firestorm","VTX 1300","VTX 1800","X-ADV 750","XL 1000 Varadero","XL 125","XRE 300"],
  },

  // ── KAWASAKI ─────────────────────────────────────────────────────────────────
  {
    name: 'Kawasaki',
    logoUrl: '/brands/kawasaki.svg',
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
    modelCatalog: ["A1 250 Samurai","A7 350 Avenger","AR 50","AR 80","AR 125","BJ 250 Estrella","Eliminator 400","EN 500 Vulcan","ER-5","ER-6f","ER-6n","EX 400","EX 650","GPX 250R","GPX 600R","GPZ 500S","GPZ 750","GPZ 900R","GPZ 1000RX","GPZ 1100","J 300","KLE 400","KLE 500","KLR 250","KLR 650","KLX 110","KLX 140","KLX 150","KLX 230","KLX 300","KLX 450R","KX 250","KX 450","Ninja 250","Ninja 300","Ninja 400","Ninja 500","Ninja 650","Ninja 1000","Ninja H2","Ninja H2R","Ninja ZX-6R","Ninja ZX-9R","Ninja ZX-10R","Ninja ZX-14R","Ninja ZX-25R","Ninja ZX-4R","Versys 300","Versys 650","Versys 1000","Vulcan 400","Vulcan 500","Vulcan 800","Vulcan 900","Vulcan 1500","Vulcan 1600","Vulcan 1700","Vulcan 2000","W175","W400","W650","W800","Z 125","Z 250","Z 300","Z 400","Z 650","Z 650RS","Z 750","Z 800","Z 900","Z 900RS","Z 1000","Z 1100","ZRX 1100","ZRX 1200","ZX-7R","ZZR 400","ZZR 600","ZZR 1100","ZZR 1200","ZZR 1400"],
  },

  // ── SUZUKI ──────────────────────────────────────────────────────────────────
  {
    name: 'Suzuki',
    logoUrl: '/brands/suzuki.svg',
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
    modelCatalog: ["Address 110","Address 125","AN 125","AN 250","AN 400","AN 650 Burgman","B-King 1300","Bandit GSF 400","Bandit GSF 600","Bandit GSF 1200","Bandit GSF 1250","Boulevard C50","Boulevard C90","Boulevard M50","Boulevard M90","Boulevard M109R","Burgman 125","Burgman 200","Burgman 400","Burgman 650","DR 125","DR 200","DR 350","DR 650","DR-Z 125","DR-Z 250","DR-Z 400","GN 125","GN 250","GS 400","GS 500","GS 650","GS 750","GS 850","GS 1000","GS 1100","GSF 400","GSF 600","GSF 1200","GSF 1250","GSR 600","GSR 750","GSX 250R","GSX 400","GSX 550","GSX 600F Katana","GSX 750F Katana","GSX 1400","GSX-R 150","GSX-R 250","GSX-R 400","GSX-R 600","GSX-R 750","GSX-R 1000","GSX-S 125","GSX-S 150","GSX-S 750","GSX-S 1000","GT 250","GT 380","GT 500","GT 550","GT 750","GW 250","Hayabusa GSX1300R","Inazuma 250","Intruder 400","Intruder 800","Intruder 1400","Katana 650","Katana 1000","RE 5","RF 400","RF 600","RF 900","RGV 250 Gamma","Satria F150","Smash 110","SV 650","SV 1000","T500 Titan","TL 1000R","TL 1000S","TS 125","TS 185","V-Strom 250","V-Strom 650","V-Strom 1000","V-Strom 1050","VS 750 Intruder","VS 800 Intruder","VS 1400 Intruder","XF 650 Freewind"],
  },

  // ── ROYAL ENFIELD ────────────────────────────────────────────────────────────
  {
    name: 'Royal Enfield',
    logoUrl: '/brands/royalenfield.svg',
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
    modelCatalog: ["Bullet 350","Bullet 500","Bullet Electra 350","Bullet Electra X 350","Classic 350","Classic 500","Classic Gunmetal Grey","Continental GT 535","Continental GT 650","Fury 175","Himalayan 411","Himalayan 450","Hunter 350","Interceptor 650","Lightning 535","Machismo 350","Meteor 350","Scram 411","Shotgun 650","Super Meteor 650","Thunderbird 350","Thunderbird 350X","Thunderbird 500","Thunderbird 500X","Thunderbird Storm 350","UCE Classic 350","UCE Classic 500"],
  },

  // ── KTM ─────────────────────────────────────────────────────────────────────
  {
    name: 'KTM',
    logoUrl: '/brands/ktm.svg',
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
    modelCatalog: ["50 SX","65 SX","85 SX","125 Duke","125 EXC","125 SX","150 SX","150 XC-W","200 Duke","200 EXC","250 Adventure","250 Duke","250 EXC","250 EXC-F","250 SX","250 SX-F","250 XC-F","300 EXC","300 XC","350 EXC-F","390 Adventure","390 Duke","390 RC","450 EXC-F","450 Rally","450 SX-F","500 EXC-F","640 Duke","640 LC4","690 Duke","690 Enduro","690 Rally","790 Adventure","790 Duke","890 Adventure","890 Duke","890 Duke R","950 Adventure","950 Supermoto","990 Adventure","990 Duke","990 SM","1050 Adventure","1090 Adventure","1190 Adventure","1190 RC8","1290 Super Adventure","1290 Super Adventure R","1290 Super Adventure S","1290 Super Duke GT","1290 Super Duke R","1290 Super Enduro","RC 125","RC 200","RC 390","RC 8R"],
  },

  // ── VESPA ───────────────────────────────────────────────────────────────────
  {
    name: 'Vespa',
    logoUrl: '/brands/vespa.svg',
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
    modelCatalog: ["946","ET2 50","ET4 50","ET4 125","ET4 150","Elettrica","GS 150","GS 160","GT 60","GT 125","GT 200","GTS 125","GTS 125 Touring","GTS 250","GTS 300","GTS 300 HPE","GTS 300 Super","GTS 300 Super Sport","GTV 125","GTV 250","GTV 300","Granturismo 125","Granturismo 200","GTV","LX 50","LX 125","LX 150","LXV 50","LXV 125","P125X","PK 50","PK 125","Primavera 50","Primavera 125","Primavera 150","PX 125","PX 150","PX 200","Rally 180","Rally 200","S 50","S 125","S 150","Sei Giorni 300","Sprint 50","Sprint 125","Sprint 150","Sprint Veloce","Super 150","VBB 150"],
  },

  // ── HARLEY-DAVIDSON ──────────────────────────────────────────────────────────
  {
    name: 'Harley-Davidson',
    logoUrl: '/brands/harley.svg',
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
    modelCatalog: ["Breakout 114","CVO Limited","CVO Road Glide","CVO Street Glide","Deluxe","Dyna Fat Bob","Dyna Low Rider","Dyna Street Bob","Dyna Super Glide","Dyna Wide Glide","Electra Glide Ultra Classic","Fat Bob 114","Fat Boy","Fat Boy 114","FXDR 114","Heritage Classic","Iron 883","Iron 1200","Knucklehead","Low Rider S","Low Rider ST","Nightster 975","Pan America 1250","Road Glide","Road Glide Special","Road King","Road King Special","Softail Standard","Sport Glide","Sportster 883","Sportster 1200","Sportster S","Street 500","Street 750","Street Bob 114","Street Glide","Street Glide Special","Super Glide","Touring Electra Glide","Ultra Limited","V-Rod","V-Rod Muscle","WLA","XG 500","XG 750"],
  },

  // ── BMW MOTORRAD ─────────────────────────────────────────────────────────────
  {
    name: 'BMW Motorrad',
    logoUrl: '/brands/bmw.svg',
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
    modelCatalog: ["C 400 GT","C 400 X","C 600 Sport","C 650 GT","C 650 Sport","CE 04","F 650 CS","F 650 GS","F 700 GS","F 750 GS","F 800 GS","F 800 R","F 800 S","F 800 ST","F 850 GS","F 850 GS Adventure","F 900 R","F 900 XR","G 310 GS","G 310 R","G 450 X","G 650 GS","G 650 Xchallenge","G 650 Xcountry","G 650 Xmoto","HP2 Enduro","HP2 Megamoto","HP2 Sport","HP4","K 100","K 1100","K 1200 GT","K 1200 LT","K 1200 R","K 1200 RS","K 1200 S","K 1300 GT","K 1300 R","K 1300 S","K 1600 B","K 1600 GT","K 1600 GTL","M 1000 R","M 1000 RR","M 1000 XR","R 1100 GS","R 1150 GS","R 1200 C","R 1200 GS","R 1200 R","R 1200 RS","R 1200 RT","R 1200 S","R 1250 GS","R 1250 GS Adventure","R 1250 R","R 1250 RS","R 1250 RT","R 18","R 80","R 90","R 100 RS","S 1000 R","S 1000 RR","S 1000 XR"],
  },

  // ── DUCATI ───────────────────────────────────────────────────────────────────
  {
    name: 'Ducati',
    logoUrl: '/brands/ducati.svg',
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
    modelCatalog: ["748","749","848","916","996","998","999","Diavel 1200","Diavel 1260","Diavel V4","Hypermotard 698","Hypermotard 821","Hypermotard 939","Hypermotard 950","Hyperstrada 821","Monster 400","Monster 600","Monster 620","Monster 695","Monster 696","Monster 750","Monster 796","Monster 821","Monster 900","Monster 937","Monster S4","Multistrada 620","Multistrada 1000","Multistrada 1100","Multistrada 1200","Multistrada 1260","Multistrada V2","Multistrada V4","Panigale 899","Panigale 959","Panigale V2","Panigale V4","Panigale V4 S","Panigale V4 R","Scrambler 400","Scrambler Cafe Racer","Scrambler Desert Sled","Scrambler Full Throttle","Scrambler Icon","Scrambler Nightshift","Scrambler Sixty2","Sport 1000","Sportclassic GT 1000","ST2","ST3","ST4","Streetfighter 848","Streetfighter V2","Streetfighter V4","Supersport 937","Supermono","XDiavel","XDiavel S"],
  },

  // ── TRIUMPH ──────────────────────────────────────────────────────────────────
  {
    name: 'Triumph',
    logoUrl: '/brands/triumph.svg',
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
    modelCatalog: ["Bobber","Bobber Black","Bonneville Bobber","Bonneville T100","Bonneville T120","Bonneville T140","Daytona 600","Daytona 650","Daytona 675","Daytona 675R","Daytona 955i","Daytona Moto2 765","Rocket 3","Rocket III Classic","Scrambler 400 X","Scrambler 900","Scrambler 1200 XC","Scrambler 1200 XE","Speed 400","Speed Master","Speed Triple 660","Speed Triple 765","Speed Triple 955","Speed Triple 1050","Speed Triple 1200 RS","Sprint GT","Sprint ST","Street Cup","Street Scrambler","Street Triple 660","Street Triple 765","Street Triple 765 R","Street Triple 765 RS","Street Triple R","Street Triple RS","Street Twin","Thunderbird","Thunderbird Commander","Thunderbird LT","Thunderbird Storm","Tiger 800","Tiger 850 Sport","Tiger 900","Tiger 1050","Tiger 1100","Tiger 1200","Thruxton 900","Thruxton 1200","Thruxton 1200 R","Trophy 900","Trophy 1200"],
  },

  // ── APRILIA ──────────────────────────────────────────────────────────────────
  {
    name: 'Aprilia',
    logoUrl: '/brands/aprilia.svg',
    logoFallback: 'APR',
    country: 'Italy',
    color: '#000000',
    models: [
      { name: 'RS 125',        cc: 125,  type: 'sport',     driveType: 'chain', stroke: '2-stroke', cylinders: 'single',        yearFrom: 1992, yearTo: 2012, color: '#000000' },
      { name: 'RS 250',        cc: 249,  type: 'sport',     driveType: 'chain', stroke: '2-stroke', cylinders: 'v-twin (90°)',  yearFrom: 1994, yearTo: 2004, color: '#000000' },
      { name: 'RS 660',        cc: 659,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2020, yearTo: NOW,  color: '#000000' },
      { name: 'RSV4',          cc: 1099, type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v4',            yearFrom: 2009, yearTo: NOW,  color: '#000000' },
      { name: 'Tuono V4',      cc: 1077, type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v4',            yearFrom: 2011, yearTo: NOW,  color: '#000000' },
      { name: 'Dorsoduro 900', cc: 896,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (90°)',  yearFrom: 2017, yearTo: 2021, color: '#000000' },
      { name: 'Shiver GT',     cc: 896,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'v-twin (90°)',  yearFrom: 2017, yearTo: 2020, color: '#000000' },
    ],
    modelCatalog: ["Atlantic 125","Atlantic 300","Atlantic 500","Caponord 1000","Caponord 1200","Climber 280","Dorsoduro 750","Dorsoduro 900","ETV 1000 Caponord","Falco SL1000","Futura RST1000","Mana 850","Mana GT 850","Pegaso 655","Pegaso 660","RS 50","RS 125","RS 250","RS 660","RST 1000 Futura","RSV 1000","RSV4","RSV4 Factory","RSV4 RF","RSV4 1100","RXV 450","RXV 550","Scarabeo 100","Scarabeo 125","Scarabeo 150","Scarabeo 200","Scarabeo 300","Scarabeo 400","Scarabeo 500","Shiver 750","Shiver GT 900","SR 50","SR 125","SR 150","SR Max 125","SR Max 300","SXV 450","SXV 550","Tuareg 660","Tuono 1000","Tuono V4","Tuono V4 1100"],
  },

  // ── BENELLI ──────────────────────────────────────────────────────────────────
  {
    name: 'Benelli',
    logoUrl: '/brands/benelli.svg',
    logoFallback: 'BNL',
    country: 'Italy',
    color: '#CC0000',
    models: [
      { name: 'TRK 502',   cc: 500,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2017, yearTo: NOW,  color: '#CC0000' },
      { name: 'TRK 800',   cc: 754,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2021, yearTo: NOW,  color: '#CC0000' },
      { name: 'TNT 600i',  cc: 600,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 2012, yearTo: 2018, color: '#CC0000' },
      { name: 'Leoncino 500', cc: 499, type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2017, yearTo: NOW,  color: '#CC0000' },
      { name: '302S',      cc: 300,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2016, yearTo: NOW,  color: '#CC0000' },
      { name: '752S',      cc: 754,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2019, yearTo: NOW,  color: '#CC0000' },
    ],
    modelCatalog: ["180S","302R","302S","600i","752S","BN 251","BN 302","BN 302 R","BN 302 S","BN 600","BN 600 GT","Century Racer 899","Imperiale 400","Leoncino 250","Leoncino 500","Leoncino 500 Trail","Leoncino 800","Motobi 200","TNT 125","TNT 135","TNT 150","TNT 300","TNT 302 R","TNT 600i","TNT 600 GT","TNT 899","TNT 1130","TRK 251","TRK 502","TRK 502 X","TRK 800","TRK 900"],
  },

  // ── CF MOTO ──────────────────────────────────────────────────────────────────
  {
    name: 'CF Moto',
    logoUrl: '/brands/cfmoto.svg',
    logoFallback: 'CFM',
    country: 'China',
    color: '#D4192A',
    models: [
      { name: '300NK',    cc: 292,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2016, yearTo: NOW,  color: '#D4192A' },
      { name: '650NK',    cc: 649,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2013, yearTo: NOW,  color: '#D4192A' },
      { name: '700CL-X',  cc: 693,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2021, yearTo: NOW,  color: '#D4192A' },
      { name: '800MT',    cc: 799,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2021, yearTo: NOW,  color: '#D4192A' },
      { name: '300SR',    cc: 292,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single',        yearFrom: 2020, yearTo: NOW,  color: '#D4192A' },
    ],
    modelCatalog: ["150NK","150SR","250NK","250SR","300NK","300SR","400GT","400NK","450MT","450SR","650GT","650MT","650NK","700CL-X","800MT","800MT Adventure","800MT Sport","Papio 300"],
  },

  // ── MOTO GUZZI ───────────────────────────────────────────────────────────────
  {
    name: 'Moto Guzzi',
    logoUrl: '/brands/motoguzzi.svg',
    logoFallback: 'GUZ',
    country: 'Italy',
    color: '#C41E3A',
    models: [
      { name: 'V7 Stone',       cc: 853,  type: 'cruiser', driveType: 'shaft', stroke: '4-stroke', cylinders: 'v-twin (90°)', yearFrom: 2021, yearTo: NOW,  color: '#C41E3A' },
      { name: 'V9 Bobber',      cc: 853,  type: 'cruiser', driveType: 'shaft', stroke: '4-stroke', cylinders: 'v-twin (90°)', yearFrom: 2016, yearTo: NOW,  color: '#C41E3A' },
      { name: 'V85 TT',         cc: 853,  type: 'adventure', driveType: 'shaft', stroke: '4-stroke', cylinders: 'v-twin (90°)', yearFrom: 2019, yearTo: NOW, color: '#C41E3A' },
      { name: 'California 1400', cc: 1380, type: 'cruiser', driveType: 'shaft', stroke: '4-stroke', cylinders: 'v-twin (90°)', yearFrom: 2012, yearTo: NOW,  color: '#C41E3A' },
      { name: 'Griso 1200',      cc: 1151, type: 'naked',   driveType: 'shaft', stroke: '4-stroke', cylinders: 'v-twin (90°)', yearFrom: 2005, yearTo: 2016, color: '#C41E3A' },
      { name: 'Le Mans',         cc: 844,  type: 'sport',   driveType: 'shaft', stroke: '4-stroke', cylinders: 'v-twin (90°)', yearFrom: 1976, yearTo: 1993, color: '#C41E3A' },
    ],
    modelCatalog: ["1100 Sport","Audace 1400","Bellagio 940","Breva 750","Breva 850","Breva 1100","Breva 1200","California 1100","California 1400","California EV","California Special","Daytona 1000","Eldorado 1400","Falcone 500","Griso 850","Griso 1100","Griso 1200","Le Mans 750","Le Mans 850","Le Mans 1000","Lario 650","Nevada 750","Norge 850","Norge 1200","Quota 1000","Quota 1100","Sport 1100","Stelvio 1200","V7 Classic","V7 Special","V7 Stone","V7 Racer","V7 III Racer","V7 III Anniversario","V9 Bobber","V9 Roamer","V85 TT","V100 Mandello"],
  },

  // ── QJ MOTOR ─────────────────────────────────────────────────────────────────
  {
    name: 'QJ Motor',
    logoUrl: '/brands/qjmotor.svg',
    logoFallback: 'QJM',
    country: 'China',
    color: '#0071C5',
    models: [
      { name: 'SRK 600',  cc: 600, type: 'sport',   driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4', yearFrom: 2022, yearTo: NOW, color: '#0071C5' },
      { name: 'SRV 550',  cc: 550, type: 'cruiser', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2022, yearTo: NOW, color: '#0071C5' },
      { name: 'SRK 700',  cc: 693, type: 'naked',   driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2023, yearTo: NOW, color: '#0071C5' },
    ],
    modelCatalog: ["SRC 500","SRK 300","SRK 600","SRK 700","SRV 300","SRV 550","SRGT 600","SRT 800"],
  },

  // ── HUSQVARNA ────────────────────────────────────────────────────────────────
  {
    name: 'Husqvarna',
    logoUrl: '/brands/husqvarna.svg',
    logoFallback: 'HQV',
    country: 'Sweden',
    color: '#002855',
    models: [
      { name: 'Svartpilen 401',  cc: 373,  type: 'naked',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single', yearFrom: 2019, yearTo: NOW,  color: '#002855' },
      { name: 'Vitpilen 401',    cc: 373,  type: 'sport',     driveType: 'chain', stroke: '4-stroke', cylinders: 'single', yearFrom: 2018, yearTo: NOW,  color: '#002855' },
      { name: 'Norden 901',      cc: 889,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'parallel-twin', yearFrom: 2022, yearTo: NOW, color: '#002855' },
      { name: 'TE 300i',         cc: 293,  type: 'adventure', driveType: 'chain', stroke: '2-stroke', cylinders: 'single', yearFrom: 2018, yearTo: NOW,  color: '#002855' },
      { name: 'FE 350',          cc: 350,  type: 'adventure', driveType: 'chain', stroke: '4-stroke', cylinders: 'single', yearFrom: 2013, yearTo: NOW,  color: '#002855' },
    ],
    modelCatalog: ["FC 250","FC 350","FC 450","FE 250","FE 350","FE 450","FE 501","FX 350","FX 450","Norden 901","Norden 901 Expedition","Svartpilen 125","Svartpilen 200","Svartpilen 401","Svartpilen 701","TC 125","TC 250","TE 150","TE 250","TE 250i","TE 300","TE 300i","TX 300","Vitpilen 125","Vitpilen 401","Vitpilen 701"],
  },

  // ── MV AGUSTA ────────────────────────────────────────────────────────────────
  {
    name: 'MV Agusta',
    logoUrl: '/brands/mvagusta.svg',
    logoFallback: 'MVA',
    country: 'Italy',
    color: '#C41E3A',
    models: [
      { name: 'Brutale 800',      cc: 798,  type: 'naked',  driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-3',      yearFrom: 2013, yearTo: NOW,  color: '#C41E3A' },
      { name: 'Brutale 1000',     cc: 998,  type: 'naked',  driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 2019, yearTo: NOW,  color: '#C41E3A' },
      { name: 'F3 675',           cc: 675,  type: 'sport',  driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-3',      yearFrom: 2012, yearTo: 2022, color: '#C41E3A' },
      { name: 'F4',               cc: 998,  type: 'sport',  driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-4',      yearFrom: 1999, yearTo: 2018, color: '#C41E3A' },
      { name: 'Turismo Veloce 800', cc: 798, type: 'touring', driveType: 'chain', stroke: '4-stroke', cylinders: 'inline-3',   yearFrom: 2015, yearTo: NOW,  color: '#C41E3A' },
    ],
    modelCatalog: ["Brutale 675","Brutale 750","Brutale 800","Brutale 800 RR","Brutale 910","Brutale 920","Brutale 989","Brutale 990","Brutale 1000","Brutale 1000 RR","Brutale 1090","Brutale 1090 R","Dragster 800","Dragster 800 RR","Dragster 800 Rosso","F3 675","F3 800","F3 800 RR","F4 750","F4 1000","F4 R","F4 RR","F4 Tamburini","Rivale 800","Rush 1000","Superveloce 800","Superveloce S","Superveloce Serie Oro","Turismo Veloce 800","Turismo Veloce 800 Lusso","Turismo Veloce 800 Lusso S"],
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
