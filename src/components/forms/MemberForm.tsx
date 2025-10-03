import React, { useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, PlusCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Member, UsageEntry } from '@shared/types';
import { toast } from 'sonner';
const usageEntryBaseSchema = z.object({
  id: z.string(),
  osakasId: z.string(),
  matkaKm: z.coerce.number().min(0),
});
const usageEntrySchema = z.discriminatedUnion('kind', [
  usageEntryBaseSchema.extend({ kind: z.literal('ASUNTO'), vakituinen: z.literal(true) }),
  usageEntryBaseSchema.extend({ kind: z.literal('VAPAA'), tyyppi: z.enum(['lomamokki350', 'kesamokki750', 'ymparivuotinen1300']) }),
  usageEntryBaseSchema.extend({ kind: z.literal('PELTO'), pintaAlaHa: z.coerce.number().min(0), tuotantosuunta: z.enum(['kasvinviljely', 'nautakarja']), customTonniaPerHa: z.coerce.number().min(0).optional() }),
  usageEntryBaseSchema.extend({ kind: z.literal('METSA'), pintaAlaHa: z.coerce.number().min(0), tonniaPerHaOverride: z.coerce.number().min(0).optional() }),
  usageEntryBaseSchema.extend({ kind: z.literal('MUU'), ajokerratVuosi: z.coerce.number().min(0), ajoneuvonTyhjapainoTon: z.coerce.number().min(0), hyotykuormaTonPerVuosi: z.coerce.number().min(0), ajokerratSisaltaaMenoPaluu: z.boolean() }),
]);
const memberFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
  propertyId: z.string().regex(/^\d{1,3}-\d{1,3}-\d{1,4}-\d{1,4}$/, "Invalid format. Use e.g., 091-423-3-170").optional().or(z.literal("")),
  usageEntries: z.array(usageEntrySchema),
});
type MemberFormData = z.infer<typeof memberFormSchema>;
const USAGE_TYPE_OPTIONS: { value: UsageEntry['kind']; label: string }[] = [
  { value: 'ASUNTO', label: 'Permanent Residence' },
  { value: 'VAPAA', label: 'Leisure Property' },
  { value: 'PELTO', label: 'Farmland' },
  { value: 'METSA', label: 'Forest' },
  { value: 'MUU', label: 'Other Traffic' },
];
const getUsageDefaultValues = (kind: UsageEntry['kind'], memberId: string): UsageEntry => {
  const base = { id: crypto.randomUUID(), osakasId: memberId, matkaKm: 0 };
  switch (kind) {
    case 'ASUNTO': return { ...base, kind, vakituinen: true };
    case 'VAPAA': return { ...base, kind, tyyppi: 'kesamokki750' };
    case 'PELTO': return { ...base, kind, pintaAlaHa: 0, tuotantosuunta: 'kasvinviljely' };
    case 'METSA': return { ...base, kind, pintaAlaHa: 0 };
    case 'MUU': return { ...base, kind, ajokerratVuosi: 0, ajoneuvonTyhjapainoTon: 0, hyotykuormaTonPerVuosi: 0, ajokerratSisaltaaMenoPaluu: false };
    default: throw new Error('Invalid usage kind');
  }
};
interface MemberFormProps {
  associationId: string;
  member: Member | null;
  onSuccess: () => void;
  onCancel: () => void;
}
export function MemberForm({ associationId, member, onSuccess, onCancel }: MemberFormProps) {
  const newMemberId = useMemo(() => crypto.randomUUID(), []);
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: member ? { ...member, address: member.address ?? '', phone: member.phone ?? '', propertyId: member.propertyId ?? '' } : {
      id: newMemberId,
      name: '', email: '', phone: '', address: '', propertyId: '', usageEntries: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'usageEntries',
  });
  const onSubmit = async (data: MemberFormData) => {
    try {
      if (member) {
        await api(`/api/associations/${associationId}/members/${member.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        toast.success('Member updated successfully!');
      } else {
        await api(`/api/associations/${associationId}/members`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast.success('Member created successfully!');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(`Operation failed: ${error.message}`);
    }
  };
  const addUsageEntry = (kind: UsageEntry['kind']) => {
    const memberId = member?.id || newMemberId;
    append(getUsageDefaultValues(kind, memberId));
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{member ? 'Edit Member' : 'Create Member'}</DialogTitle>
          <DialogDescription>
            {member ? 'Update the details for this member.' : 'Fill in the details for the new member.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="phone" render={({ field }) => <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={form.control} name="address" render={({ field }) => <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                </div>
                <FormField control={form.control} name="propertyId" render={({ field }) => <FormItem><FormLabel>Property ID (Kiinteistötunnus)</FormLabel><FormControl><Input placeholder="e.g., 091-423-3-170" {...field} /></FormControl><FormMessage /></FormItem>} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Usage Entries</CardTitle>
                  <Select onValueChange={(value: UsageEntry['kind']) => addUsageEntry(value)}>
                    <SelectTrigger className="w-[200px]">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Add Usage Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {USAGE_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 bg-muted/50">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold mb-2">{USAGE_TYPE_OPTIONS.find(o => o.value === field.kind)?.label}</h4>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name={`usageEntries.${index}.matkaKm`} render={({ field }) => <FormItem><FormLabel>Distance (km)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                      {field.kind === 'VAPAA' && (
                        <FormField control={form.control} name={`usageEntries.${index}.tyyppi`} render={({ field: controllerField }) => (
                          <FormItem><FormLabel>Property Type</FormLabel>
                            <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="lomamokki350">Lomamökki (350t)</SelectItem>
                                <SelectItem value="kesamokki750">Kesämökki (750t)</SelectItem>
                                <SelectItem value="ymparivuotinen1300">Ympärivuotinen (1300t)</SelectItem>
                              </SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )} />
                      )}
                      {field.kind === 'PELTO' && <>
                        <FormField control={form.control} name={`usageEntries.${index}.pintaAlaHa`} render={({ field }) => <FormItem><FormLabel>Area (ha)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField control={form.control} name={`usageEntries.${index}.tuotantosuunta`} render={({ field: controllerField }) => (
                          <FormItem><FormLabel>Production Type</FormLabel>
                            <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="kasvinviljely">Crop Cultivation</SelectItem>
                                <SelectItem value="nautakarja">Cattle Farming</SelectItem>
                              </SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )} />
                      </>}
                      {field.kind === 'METSA' && <>
                        <FormField control={form.control} name={`usageEntries.${index}.pintaAlaHa`} render={({ field }) => <FormItem><FormLabel>Area (ha)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                      </>}
                      {field.kind === 'MUU' && <>
                        <FormField control={form.control} name={`usageEntries.${index}.ajokerratVuosi`} render={({ field }) => <FormItem><FormLabel>Trips/Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField control={form.control} name={`usageEntries.${index}.ajoneuvonTyhjapainoTon`} render={({ field }) => <FormItem><FormLabel>Vehicle Weight (t)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField control={form.control} name={`usageEntries.${index}.hyotykuormaTonPerVuosi`} render={({ field }) => <FormItem><FormLabel>Payload (t/year)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField control={form.control} name={`usageEntries.${index}.ajokerratSisaltaaMenoPaluu`} render={({ field }) => (
                          <FormItem className="flex flex-row items-end space-x-2 pb-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Trips include return</FormLabel><FormMessage /></FormItem>
                        )} />
                      </>}
                    </div>
                  </Card>
                ))}
                {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No usage entries added yet.</p>}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : 'Save Member'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}