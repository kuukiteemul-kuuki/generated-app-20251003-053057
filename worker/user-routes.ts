import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Env } from './core-utils';
import { RoadAssociationEntity, MemberEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import { laskeMaksut } from "@shared/calculation";
import type { Member } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- Road Associations ---
  app.get('/api/associations', async (c) => {
    await RoadAssociationEntity.ensureSeed(c.env);
    const page = await RoadAssociationEntity.list(c.env);
    return ok(c, page.items);
  });
  app.get('/api/associations/:id', async (c) => {
    const id = c.req.param('id');
    const assoc = new RoadAssociationEntity(c.env, id);
    if (!await assoc.exists()) return notFound(c);
    return ok(c, await assoc.getState());
  });
  const associationSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    address: z.string().optional(),
    contactPerson: z.string().min(1),
    contactEmail: z.string().email(),
    contactPhone: z.string().min(1),
    vyohyke: z.enum(['1', '2', '3', '4', '5']).optional(),
    annualCost: z.number().min(0).optional(),
    baseFee: z.number().min(0).optional(),
    unitFee: z.number().min(0).optional(),
  });
  app.post('/api/associations', zValidator('json', associationSchema), async (c) => {
    const body = c.req.valid('json');
    const existing = new RoadAssociationEntity(c.env, body.id);
    if (await existing.exists()) {
      return bad(c, 'Association with this property ID already exists.');
    }
    const newAssoc = await RoadAssociationEntity.create(c.env, {
      ...RoadAssociationEntity.initialState,
      ...body,
    });
    return ok(c, newAssoc);
  });
  app.put('/api/associations/:id', zValidator('json', associationSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const assoc = new RoadAssociationEntity(c.env, id);
    if (!await assoc.exists()) return notFound(c);
    await assoc.patch(body);
    return ok(c, await assoc.getState());
  });
  app.delete('/api/associations/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await RoadAssociationEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // --- Members ---
  app.get('/api/associations/:id/members', async (c) => {
    const associationId = c.req.param('id');
    const assoc = new RoadAssociationEntity(c.env, associationId);
    if (!await assoc.exists()) return notFound(c, 'Association not found');
    const state = await assoc.getState();
    const members = await Promise.all(
      state.memberIds.map(memberId => new MemberEntity(c.env, memberId).getState())
    );
    return ok(c, members);
  });
  app.get('/api/associations/:id/members/:memberId', async (c) => {
    const { id: associationId, memberId } = c.req.param();
    const member = new MemberEntity(c.env, memberId);
    if (!await member.exists()) return notFound(c, 'Member not found');
    const memberState = await member.getState();
    if (memberState.associationId !== associationId) {
      return bad(c, 'Member does not belong to this association');
    }
    return ok(c, memberState);
  });
  const usageEntryBaseSchema = z.object({ id: z.string(), osakasId: z.string(), matkaKm: z.coerce.number().min(0) });
  const asuntoSchema = usageEntryBaseSchema.extend({ kind: z.literal("ASUNTO"), vakituinen: z.literal(true) });
  const vapaaSchema = usageEntryBaseSchema.extend({ kind: z.literal("VAPAA"), tyyppi: z.enum(["lomamokki350", "kesamokki750", "ymparivuotinen1300"]) });
  const peltoSchema = usageEntryBaseSchema.extend({ kind: z.literal("PELTO"), pintaAlaHa: z.coerce.number().min(0), tuotantosuunta: z.enum(["kasvinviljely", "nautakarja"]), customTonniaPerHa: z.coerce.number().min(0).optional() });
  const metsaSchema = usageEntryBaseSchema.extend({ kind: z.literal("METSA"), pintaAlaHa: z.coerce.number().min(0), tonniaPerHaOverride: z.coerce.number().min(0).optional() });
  const muuSchema = usageEntryBaseSchema.extend({ kind: z.literal("MUU"), ajokerratVuosi: z.coerce.number().min(0), ajoneuvonTyhjapainoTon: z.coerce.number().min(0), hyotykuormaTonPerVuosi: z.coerce.number().min(0), ajokerratSisaltaaMenoPaluu: z.boolean() });
  const usageEntrySchema = z.discriminatedUnion("kind", [asuntoSchema, vapaaSchema, peltoSchema, metsaSchema, muuSchema]);
  const memberSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    propertyId: z.string().regex(/^\d{1,3}-\d{1,3}-\d{1,4}-\d{1,4}$/).optional(),
    usageEntries: z.array(usageEntrySchema),
  });
  app.post('/api/associations/:id/members', zValidator('json', memberSchema), async (c) => {
    const associationId = c.req.param('id');
    const body = c.req.valid('json');
    const assoc = new RoadAssociationEntity(c.env, associationId);
    if (!await assoc.exists()) return notFound(c, 'Association not found');
    const memberId = body.id || crypto.randomUUID();
    const newMember: Member = { ...MemberEntity.initialState, ...body, id: memberId, associationId };
    const member = new MemberEntity(c.env, memberId);
    await member.save(newMember);
    await assoc.mutate(s => ({ ...s, memberIds: [...new Set([...s.memberIds, memberId])] }));
    return ok(c, newMember);
  });
  app.put('/api/associations/:id/members/:memberId', zValidator('json', memberSchema.partial()), async (c) => {
    const { id: associationId, memberId } = c.req.param();
    const body = c.req.valid('json');
    const member = new MemberEntity(c.env, memberId);
    if (!await member.exists()) return notFound(c, 'Member not found');
    const currentState = await member.getState();
    if (currentState.associationId !== associationId) return bad(c, 'Member does not belong to this association');
    await member.patch(body);
    return ok(c, await member.getState());
  });
  app.delete('/api/associations/:id/members/:memberId', async (c) => {
    const { id: associationId, memberId } = c.req.param();
    const assoc = new RoadAssociationEntity(c.env, associationId);
    if (await assoc.exists()) {
      await assoc.mutate(s => ({ ...s, memberIds: s.memberIds.filter(id => id !== memberId) }));
    }
    const deleted = await MemberEntity.delete(c.env, memberId);
    return ok(c, { memberId, deleted });
  });
  // --- Calculation ---
  app.get('/api/associations/:id/calculate', async (c) => {
    const associationId = c.req.param('id');
    const assoc = new RoadAssociationEntity(c.env, associationId);
    if (!await assoc.exists()) return notFound(c, 'Association not found');
    const assocState = await assoc.getState();
    const members = await Promise.all(
      assocState.memberIds.map(memberId => new MemberEntity(c.env, memberId).getState())
    );
    const allUsageEntries = members.flatMap(m =>
      m.usageEntries.map(entry => ({ ...entry, osakasId: m.id }))
    );
    const results = laskeMaksut(allUsageEntries, assocState.annualCost, assocState.baseFee, assocState.vyohyke);
    return ok(c, results);
  });
}