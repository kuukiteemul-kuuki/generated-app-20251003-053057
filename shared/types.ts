export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// --- Core Data Models ---
export interface RoadAssociation {
  id: string; // Unique property identifier (kiinteistötunnus)
  name: string;
  address?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  vyohyke: '1' | '2' | '3' | '4' | '5'; // Forest zone
  // Settings
  annualCost: number;
  baseFee: number; // Perusmaksu
  unitFee: number; // Yksikkömaksu (not directly used in laskeMaksut, but good to store)
  memberIds: string[];
}
export interface Member {
  id: string; // UUID
  associationId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  propertyId?: string; // Kiinteistötunnus
  usageEntries: UsageEntry[];
}
// --- Usage Entry Types for Calculation ---
interface UsageEntryBase {
  id: string; // UUID for the entry itself
  osakasId: string; // Member ID
  matkaKm: number;
}
export interface AsuntoUsageEntry extends UsageEntryBase {
  kind: 'ASUNTO';
  vakituinen: true;
}
export interface VapaaUsageEntry extends UsageEntryBase {
  kind: 'VAPAA';
  tyyppi: 'lomamokki350' | 'kesamokki750' | 'ymparivuotinen1300';
}
export interface PeltoUsageEntry extends UsageEntryBase {
  kind: 'PELTO';
  pintaAlaHa: number;
  tuotantosuunta: 'kasvinviljely' | 'nautakarja';
  customTonniaPerHa?: number;
}
export interface MetsaUsageEntry extends UsageEntryBase {
  kind: 'METSA';
  pintaAlaHa: number;
  tonniaPerHaOverride?: number;
}
export interface MuuUsageEntry extends UsageEntryBase {
  kind: 'MUU';
  ajokerratVuosi: number;
  ajoneuvonTyhjapainoTon: number;
  hyotykuormaTonPerVuosi: number;
  ajokerratSisaltaaMenoPaluu: boolean;
}
export type UsageEntry = AsuntoUsageEntry | VapaaUsageEntry | PeltoUsageEntry | MetsaUsageEntry | MuuUsageEntry;
// --- Calculation Result Type ---
export interface CalculationResult {
  osakasId: string;
  tkm: number;
  maksu: number;
}