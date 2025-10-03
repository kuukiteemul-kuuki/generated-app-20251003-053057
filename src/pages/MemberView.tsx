import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Member, CalculationResult, UsageEntry, RoadAssociation } from '@shared/types';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { tkm, painoluku } from '@shared/calculation';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Home, BarChart, DollarSign, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MemberForm } from '@/components/forms/MemberForm';
export function MemberView() {
  const { id: associationId, memberId } = useParams<{ id: string; memberId: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [association, setAssociation] = useState<RoadAssociation | null>(null);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const fetchData = useCallback(async () => {
    if (!associationId || !memberId) return;
    try {
      setIsLoading(true);
      const [currentMember, assocData, calcData] = await Promise.all([
        api<Member>(`/api/associations/${associationId}/members/${memberId}`),
        api<RoadAssociation>(`/api/associations/${associationId}`),
        api<{ tulokset: CalculationResult[] }>(`/api/associations/${associationId}/calculate`),
      ]);
      const currentCalc = calcData.tulokset.find(c => c.osakasId === memberId);
      if (currentMember) setMember(currentMember);
      if (assocData) setAssociation(assocData);
      if (currentCalc) setCalculation(currentCalc);
    } catch (error) {
      toast.error('Failed to fetch your data.');
    } finally {
      setIsLoading(false);
    }
  }, [associationId, memberId]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchData();
  };
  const getUsageEntryDescription = (entry: UsageEntry) => {
    switch (entry.kind) {
      case 'ASUNTO': return 'Permanent Residence';
      case 'VAPAA': return `Leisure: ${entry.tyyppi.replace(/([A-Z])/g, ' $1').replace('mokki', 'mökki').trim()}`;
      case 'PELTO': return `Farmland: ${entry.pintaAlaHa} ha (${entry.tuotantosuunta})`;
      case 'METSA': return `Forest: ${entry.pintaAlaHa} ha`;
      case 'MUU': return 'Other Traffic';
      default: return 'Unknown';
    }
  };
  if (isLoading) {
    return <MemberViewSkeleton />;
  }
  if (!member || !association) {
    return <div>Member or Association data not found.</div>;
  }
  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Member Portal</h1>
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2"><User /> {member.name}</CardTitle>
                    <CardDescription>Contact Information</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsFormOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {member.email}</p>
                <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {member.phone || 'Not provided'}</p>
                <p className="flex items-center gap-2 text-sm"><Home className="h-4 w-4 text-muted-foreground" /> {member.address || 'Not provided'}</p>
                <p className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" /> {member.propertyId || 'Not provided'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Fee Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Total tkm</span>
                  <span className="text-2xl font-bold flex items-center gap-2"><BarChart className="h-5 w-5" />{calculation?.tkm.toLocaleString('fi-FI') ?? 'N/A'}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Annual Fee</span>
                  <span className="text-2xl font-bold text-blue-600 flex items-center gap-2"><DollarSign className="h-5 w-5" />{calculation?.maksu.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' }) ?? 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Usage Breakdown</CardTitle>
                    <CardDescription>Details of your road usage entries for this calculation period.</CardDescription>
                  </div>
                  {calculation && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total Fee</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {calculation.maksu.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR' })}
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Distance (km)</TableHead>
                      <TableHead>Weight (t/v)</TableHead>
                      <TableHead className="text-right">tkm</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.usageEntries.length > 0 ? (
                      member.usageEntries.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Badge variant="secondary">{entry.kind}</Badge>
                            <p className="text-xs text-muted-foreground">{getUsageEntryDescription(entry)}</p>
                          </TableCell>
                          <TableCell>{entry.matkaKm.toLocaleString('fi-FI')}</TableCell>
                          <TableCell>{painoluku(entry, association.vyohyke).toLocaleString('fi-FI')}</TableCell>
                          <TableCell className="text-right font-medium">{tkm(entry, association.vyohyke).toLocaleString('fi-FI')}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No usage entries found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <MemberForm
            associationId={associationId!}
            member={member}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Toaster />
    </>
  );
}
const MemberViewSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-9 w-1/3" />
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-8 w-1/4" /></div>
            <div className="flex justify-between"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-8 w-1/4" /></div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-2/3 mt-2" /></CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);