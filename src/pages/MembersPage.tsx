import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Member, CalculationResult } from '@shared/types';
import { MemberForm } from '@/components/forms/MemberForm';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
export function MembersPage() {
  const { id: associationId } = useParams<{ id: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fetchData = useCallback(async () => {
    if (!associationId) return;
    try {
      // Don't set loading to true here if it's a refresh, only on initial load
      const [membersData, calcData] = await Promise.all([
        api<Member[]>(`/api/associations/${associationId}/members`),
        api<{ tulokset: CalculationResult[] }>(`/api/associations/${associationId}/calculate`),
      ]);
      setMembers(membersData);
      setCalculations(calcData.tulokset);
    } catch (error) {
      toast.error('Failed to fetch member data.');
    } finally {
      setIsLoading(false);
    }
  }, [associationId]);
  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);
  const confirmDelete = (memberId: string) => {
    setDeletingId(memberId);
    setIsConfirmOpen(true);
  };
  const handleDelete = async () => {
    if (!associationId || !deletingId) return;
    try {
      await api(`/api/associations/${associationId}/members/${deletingId}`, { method: 'DELETE' });
      toast.success('Member deleted.');
      setIsLoading(true);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to delete member.');
    } finally {
      setDeletingId(null);
      setIsConfirmOpen(false);
    }
  };
  const openEditForm = (member: Member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };
  const openCreateForm = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };
  const onFormSuccess = () => {
    closeForm();
    setIsLoading(true); // Show loading skeleton while data refreshes
    fetchData();
  };
  const getMemberCalc = (memberId: string) => {
    return calculations.find(c => c.osakasId === memberId);
  };
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Members</h1>
        <Button onClick={openCreateForm}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Members</CardTitle>
          <CardDescription>Add, edit, and view members of the road association.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>tkm</TableHead>
                <TableHead>Fee (€)</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : members.length > 0 ? (
                members.map((member) => {
                  const calc = getMemberCalc(member.id);
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{calc?.tkm.toLocaleString('fi-FI') ?? 'N/A'}</TableCell>
                      <TableCell>{calc?.maksu.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'N/A'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => openEditForm(member)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => confirmDelete(member.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No members found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <MemberForm
            associationId={associationId!}
            member={editingMember}
            onSuccess={onFormSuccess}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDelete}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the member and their data."
      />
      <Toaster />
    </>
  );
}