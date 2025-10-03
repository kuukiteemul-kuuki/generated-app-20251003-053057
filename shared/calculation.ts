import type { UsageEntry, CalculationResult, RoadAssociation } from './types';
export const DEFAULTS = {
  // Ohjearvot (tonnia/v) – sisältävät meno–paluun
  asuntoT: 1700, // vakituinen
  vapaa: {
    lomamokki350: 350,
    kesamokki750: 750,
    ymparivuotinen1300: 1300,
  },
  pelto: {
    kasvinviljely: 60, // t/ha
    nautakarja: 130,   // t/ha
  },
  // Metsä vyöhykkeet (t/ha) – viisi aluetta
  metsaVyohykkeet: {
    '1': 21,
    '2': 18,
    '3': 11,
    '4': 7,
    '5': 3,
  },
};
export function painoluku(e: UsageEntry, associationVyohyke?: RoadAssociation['vyohyke']): number {
  switch (e.kind) {
    case "ASUNTO":
      return DEFAULTS.asuntoT;
    case "VAPAA":
      return DEFAULTS.vapaa[e.tyyppi];
    case "PELTO": {
      const perHa =
        (typeof e.customTonniaPerHa !== "undefined" && e.customTonniaPerHa !== null)
          ? e.customTonniaPerHa
          : (e.tuotantosuunta === "kasvinviljely"
            ? DEFAULTS.pelto.kasvinviljely
            : e.tuotantosuunta === "nautakarja"
            ? DEFAULTS.pelto.nautakarja
            : DEFAULTS.pelto.kasvinviljely);
      return perHa * e.pintaAlaHa;
    }
    case "METSA": {
      const perHa =
        (typeof e.tonniaPerHaOverride !== "undefined" && e.tonniaPerHaOverride !== null)
          ? e.tonniaPerHaOverride
          : (typeof associationVyohyke !== "undefined" && associationVyohyke !== null)
            ? DEFAULTS.metsaVyohykkeet[associationVyohyke]
            : DEFAULTS.metsaVyohykkeet[3];
      return perHa * e.pintaAlaHa;
    }
    case "MUU": {
      const multip = e.ajokerratSisaltaaMenoPaluu ? 1 : 2; // jos ajokerrat eivät sisällä paluuta
      const A = e.ajokerratVuosi * multip;
      const B = e.ajoneuvonTyhjapainoTon;
      const C = e.hyotykuormaTonPerVuosi;
      return A * B + C;
    }
    default:
      return 0;
  }
}
export function tkm(e: UsageEntry, associationVyohyke?: RoadAssociation['vyohyke']): number {
  // tonnikilometrit = painoluku * yhdensuuntainen matka (km)
  return painoluku(e, associationVyohyke) * e.matkaKm;
}
export function round(x: number, dec: number): number {
  const p = Math.pow(10, dec);
  return Math.round(x * p) / p;
}
export function laskeMaksut(entries: UsageEntry[], kokonaisKustannusEuroa: number, perusmaksuPerOsakasEuroa: number, associationVyohyke: RoadAssociation['vyohyke']): { tulokset: CalculationResult[], summaTkm: number } {
  if (typeof perusmaksuPerOsakasEuroa === "undefined" || perusmaksuPerOsakasEuroa === null) {
    perusmaksuPerOsakasEuroa = 0;
  }
  const osakasTkm = new Map<string, number>();
  for (const e of entries) {
    const v = tkm(e, associationVyohyke);
    osakasTkm.set(e.osakasId, (osakasTkm.get(e.osakasId) || 0) + v);
  }
  const uniqueOsakkaita = osakasTkm.size;
  const perusYhteensa = perusmaksuPerOsakasEuroa * uniqueOsakkaita;
  const jaettava = Math.max(0, kokonaisKustannusEuroa - perusYhteensa);
  const summaTkm = Array.from(osakasTkm.values()).reduce((a, b) => a + b, 0);
  const tulokset = Array.from(osakasTkm.entries()).map(([osakasId, osTkm]) => ({
    osakasId,
    tkm: round(osTkm, 3),
    maksu: round((summaTkm > 0 ? (osTkm / summaTkm) * jaettava : 0) + perusmaksuPerOsakasEuroa, 2),
  }));
  return { tulokset, summaTkm: round(summaTkm, 3) };
}