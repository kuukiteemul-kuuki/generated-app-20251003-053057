import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Users, BarChart, Save, Loader2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { RoadAssociation, CalculationResult } from '@shared/types';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
const settingsSchema = z.object({
  annualCost: z.coerce.number().min(0),
  baseFee: z.coerce.number().min(0),
  unitFee: z.coerce.number().min(0),
  vyohyke: z.enum(['1', '2', '3', '4', '5']),
});
type SettingsFormData = z.infer<typeof settingsSchema>;
export function AssociationDashboard() {
  const { id: associationId } = useParams<{ id: string }>();
  const [association, setAssociation] = useState<RoadAssociation | null>(null);
  const [calculation, setCalculation] = useState<{ tulokset: CalculationResult[], summaTkm: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });
  const fetchData = useCallback(async () => {
    if (!associationId) return;
    try {
      setLoading(true);
      const [assocData, calcData] = await Promise.all([
        api<RoadAssociation>(`/api/associations/${associationId}`),
        api<{ tulokset: CalculationResult[], summaTkm: number }>(`/api/associations/${associationId}/calculate`),
      ]);
      setAssociation(assocData);
      setCalculation(calcData);
      form.reset({
        annualCost: assocData.annualCost,
        baseFee: assocData.baseFee,
        unitFee: assocData.unitFee,
        vyohyke: assocData.vyohyke,
      });
    } catch (error) {
      toast.error("Failed to load association data.");
    } finally {
      setLoading(false);
    }
  }, [associationId, form]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleSettingsSubmit = async (data: SettingsFormData) => {
    if (!associationId) return;
    try {
      const updated = await api<RoadAssociation>(`/api/associations/${associationId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setAssociation(updated);
      toast.success("Settings saved successfully!");
      fetchData(); // Re-run calculation after saving
    } catch (error) {
      toast.error("Failed to save settings.");
    }
  };
  if (loading) {
    return <DashboardSkeleton />;
  }
  if (!association) {
    return <div>Association not found.</div>;
  }
  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard: {association.name}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Annual Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{association.annualCost.toLocaleString('fi-FI')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{association.memberIds.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ton-Kilometers (tkm)</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculation?.summaTkm.toLocaleString('fi-FI') ?? 'N/A'}</div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Association Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSettingsSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField control={form.control} name="annualCost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Annual Cost (€)</FormLabel>
                      <FormControl><Input type="number" placeholder="10000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="baseFee" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Fee per Member (€)</FormLabel>
                      <FormControl><Input type="number" placeholder="15" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="unitFee" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Fee (€ / tkm)</FormLabel>
                      <FormControl><Input type="number" step="0.01" placeholder="0.32" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="vyohyke" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Forest Zone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 (South Coast)</SelectItem>
                          <SelectItem value="2">2 (South-West)</SelectItem>
                          <SelectItem value="3">3 (Central)</SelectItem>
                          <SelectItem value="4">4 (North-Central)</SelectItem>
                          <SelectItem value="5">5 (Lapland)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  );
}
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-9 w-1/2" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent><Skeleton className="h-8 w-1/3" /></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent><Skeleton className="h-8 w-1/3" /></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent><Skeleton className="h-8 w-1/3" /></CardContent>
      </Card>
    </div>
    <Card>
      <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></div>
        </div>
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  </div>
);