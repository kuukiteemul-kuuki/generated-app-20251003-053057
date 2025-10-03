import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { RoadAssociation } from '@shared/types';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
const associationSchema = z.object({
  id: z.string().min(3, 'Property ID is required'),
  name: z.string().min(3, 'Association name is required'),
  address: z.string().optional(),
  contactPerson: z.string().min(3, 'Contact person is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(5, 'Phone number is required'),
  vyohyke: z.enum(['1', '2', '3', '4', '5']),
});
type AssociationFormData = z.infer<typeof associationSchema>;
export function SuperAdminDashboard() {
  const [associations, setAssociations] = useState<RoadAssociation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssociation, setEditingAssociation] = useState<RoadAssociation | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const form = useForm<AssociationFormData>({
    resolver: zodResolver(associationSchema),
    defaultValues: { id: '', name: '', address: '', contactPerson: '', contactEmail: '', contactPhone: '', vyohyke: '3' },
  });
  const fetchAssociations = async () => {
    try {
      setIsLoading(true);
      const data = await api<RoadAssociation[]>('/api/associations');
      setAssociations(data);
    } catch (error) {
      toast.error('Failed to fetch associations.');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchAssociations();
  }, []);
  const handleFormSubmit = async (data: AssociationFormData) => {
    try {
      if (editingAssociation) {
        const updated = await api<RoadAssociation>(`/api/associations/${editingAssociation.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        setAssociations(associations.map((a) => (a.id === updated.id ? updated : a)));
        toast.success('Association updated successfully!');
      } else {
        const newAssociation = await api<RoadAssociation>('/api/associations', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        setAssociations([...associations, newAssociation]);
        toast.success('Association created successfully!');
      }
      closeForm();
    } catch (error: any) {
      toast.error(`Operation failed: ${error.message}`);
    }
  };
  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setIsConfirmOpen(true);
  };
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api(`/api/associations/${deletingId}`, { method: 'DELETE' });
      setAssociations(associations.filter((a) => a.id !== deletingId));
      toast.success('Association deleted.');
    } catch (error) {
      toast.error('Failed to delete association.');
    } finally {
      setDeletingId(null);
      setIsConfirmOpen(false);
    }
  };
  const openEditForm = (association: RoadAssociation) => {
    setEditingAssociation(association);
    form.reset(association);
    setIsFormOpen(true);
  };
  const openCreateForm = () => {
    setEditingAssociation(null);
    form.reset({ id: '', name: '', address: '', contactPerson: '', contactEmail: '', contactPhone: '', vyohyke: '3' });
    setIsFormOpen(true);
  };
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAssociation(null);
    form.reset();
  };
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Road Associations</h1>
        <Button onClick={openCreateForm}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Association
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Associations</CardTitle>
          <CardDescription>A list of all road associations in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : associations.length > 0 ? (
                associations.map((assoc) => (
                  <TableRow key={assoc.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{assoc.id}</TableCell>
                    <TableCell>{assoc.name}</TableCell>
                    <TableCell>{assoc.address}</TableCell>
                    <TableCell>{assoc.vyohyke}</TableCell>
                    <TableCell>{assoc.contactPerson}</TableCell>
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
                          <DropdownMenuItem onSelect={() => openEditForm(assoc)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => confirmDelete(assoc.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No associations found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAssociation ? 'Edit Association' : 'Create Association'}</DialogTitle>
            <DialogDescription>
              {editingAssociation ? 'Update the details of the association.' : 'Fill in the details for the new association.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property ID (Kiinteistötunnus)</FormLabel>
                  <FormControl><Input placeholder="e.g., 301-404-2-53" {...field} disabled={!!editingAssociation} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Association Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Metsätien Tiekunta" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input placeholder="e.g., Metsätie 1, 00100 Helsinki" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl><Input placeholder="e.g., Matti Meikäläinen" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vyohyke" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forest Zone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormField control={form.control} name="contactEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl><Input placeholder="e.g., matti@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="contactPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl><Input placeholder="e.g., 040-1234567" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Association'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDelete}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the road association and all its data."
      />
      <Toaster />
    </>
  );
}