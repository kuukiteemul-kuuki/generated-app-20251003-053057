import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Home,
  Users,
  LogOut,
  Menu,
  Building,
  Shield,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
const NavItem = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-muted text-primary'
      )
    }
  >
    <Icon className="h-4 w-4" />
    {children}
  </NavLink>
);
const SidebarContent = () => {
  const { role, associationId, memberId, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <NavLink to="/" className="flex items-center gap-2 font-semibold">
          <Building className="h-6 w-6 text-blue-600" />
          <span className="">OK Eki</span>
        </NavLink>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {role === 'SuperAdmin' && (
            <NavItem to="/super-admin" icon={Shield}>
              Associations
            </NavItem>
          )}
          {role === 'AssociationAdmin' && associationId && (
            <>
              <NavItem to={`/association/${associationId}/dashboard`} icon={Home}>
                Dashboard
              </NavItem>
              <NavItem to={`/association/${associationId}/members`} icon={Users}>
                Members
              </NavItem>
            </>
          )}
          {role === 'Member' && associationId && memberId && (
             <NavItem to={`/association/${associationId}/member/${memberId}`} icon={User}>
                My Info
              </NavItem>
          )}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};
export function AppLayout() {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
             <div className="flex-grow text-center font-semibold">
                OK Eki
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background md:block">
        <SidebarContent />
      </div>
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          <Outlet />
        </main>
      </div>
    </div>
  );
}