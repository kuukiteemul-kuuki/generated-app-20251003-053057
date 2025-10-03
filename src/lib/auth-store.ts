import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
type Role = 'SuperAdmin' | 'AssociationAdmin' | 'Member' | null;
interface AuthState {
  role: Role;
  associationId: string | null;
  memberId: string | null;
  loginAsSuperAdmin: () => void;
  loginAsAssociationAdmin: (associationId: string) => void;
  loginAsMember: (associationId: string, memberId: string) => void;
  logout: () => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      associationId: null,
      memberId: null,
      loginAsSuperAdmin: () => set({ role: 'SuperAdmin', associationId: null, memberId: null }),
      loginAsAssociationAdmin: (associationId) => set({ role: 'AssociationAdmin', associationId, memberId: null }),
      loginAsMember: (associationId, memberId) => set({ role: 'Member', associationId, memberId }),
      logout: () => set({ role: null, associationId: null, memberId: null }),
    }),
    {
      name: 'tievelho-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);