import { IndexedEntity, Index } from "./core-utils";
import type { RoadAssociation, Member } from "@shared/types";
import type { Env } from "./core-utils";
const SEED_MEMBERS: ReadonlyArray<Member> = [{
  id: "member-seed-1",
  associationId: "1234567",
  name: "Matti Meikäläinen",
  email: "matti.meikalainen@example.com",
  phone: "040-1112222",
  address: "Metsätie 1, 90210 Oulu",
  propertyId: "305-405-1-123",
  usageEntries: [
    { id: "ue-1-1", osakasId: "member-seed-1", kind: "ASUNTO", matkaKm: 1.2, vakituinen: true }
  ]
},
{
  id: "member-seed-2",
  associationId: "1234567",
  name: "Liisa Järvinen",
  email: "liisa.jarvinen@example.com",
  phone: "050-3334444",
  address: "Rantapolku 5, 90210 Oulu",
  propertyId: "305-405-2-234",
  usageEntries: [
    { id: "ue-2-1", osakasId: "member-seed-2", kind: "VAPAA", matkaKm: 0.8, tyyppi: "kesamokki750" }
  ]
},
{
  id: "member-seed-3",
  associationId: "1234567",
  name: "Pekka Virtanen",
  email: "pekka.virtanen@example.com",
  phone: "045-5556666",
  address: "Pellonreuna 10, 90210 Oulu",
  propertyId: "305-406-1-1",
  usageEntries: [
    { id: "ue-3-1", osakasId: "member-seed-3", kind: "PELTO", matkaKm: 2.5, pintaAlaHa: 12.3, tuotantosuunta: "kasvinviljely" },
    { id: "ue-3-2", osakasId: "member-seed-3", kind: "METSA", matkaKm: 3.1, pintaAlaHa: 45 }
  ]
}];
export class RoadAssociationEntity extends IndexedEntity<RoadAssociation> {
  static readonly entityName = "association";
  static readonly indexName = "associations";
  static readonly initialState: RoadAssociation = {
    id: "",
    name: "",
    address: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    vyohyke: '3',
    annualCost: 10000,
    baseFee: 15,
    unitFee: 0.32,
    memberIds: []
  };
  static override keyOf(state: {id: string;}): string {
    return state.id;
  }
  static readonly seedData: ReadonlyArray<RoadAssociation> = [
  {
    id: "1234567",
    name: "Palomaan tiekunta",
    address: "Palomaantie 123, 90210 Oulu",
    contactPerson: "Esko Esimerkki",
    contactEmail: "esko.esimerkki@example.com",
    contactPhone: "050-1234567",
    vyohyke: '4',
    annualCost: 25000,
    baseFee: 15,
    unitFee: 0.32,
    memberIds: []
  }];
  static override async ensureSeed(env: Env): Promise<void> {
    const idx = new Index<string>(env, this.indexName);
    const ids = await idx.list();
    const seedAssocData = this.seedData[0];
    if (!ids.includes(seedAssocData.id) && seedAssocData) {
      // Create all seed members first, ensuring they are saved and indexed.
      await Promise.all(SEED_MEMBERS.map(m => MemberEntity.create(env, m)));
      // Create the association with the member IDs linked.
      const assocWithMembers: RoadAssociation = {
        ...seedAssocData,
        memberIds: SEED_MEMBERS.map((m) => m.id)
      };
      // Use the static create method to ensure the association is also saved and indexed.
      await RoadAssociationEntity.create(env, assocWithMembers);
    }
  }
}
export class MemberEntity extends IndexedEntity<Member> {
  static readonly entityName = "member";
  static readonly indexName = "all_members";
  static readonly initialState: Member = {
    id: "",
    associationId: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    propertyId: "",
    usageEntries: []
  };
}