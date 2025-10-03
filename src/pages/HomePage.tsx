import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/lib/auth-store';
import { Building, Shield, User, Users } from 'lucide-react';
import { Toaster, toast } from 'sonner';
export function HomePage() {
  const navigate = useNavigate();
  const { loginAsSuperAdmin, loginAsAssociationAdmin, loginAsMember } = useAuthStore();
  const handleSuperAdminLogin = () => {
    loginAsSuperAdmin();
    navigate('/super-admin');
  };
  const handleAssociationAdminLogin = () => {
    const mockAssociationId = '1234567'; // Use seed data ID
    loginAsAssociationAdmin(mockAssociationId);
    navigate(`/association/${mockAssociationId}/dashboard`);
  };
  const handleMemberLogin = () => {
    const mockAssociationId = '1234567'; // Use seed data ID
    const mockMemberId = "member-seed-1"; // Use seed data ID
    loginAsMember(mockAssociationId, mockMemberId);
    navigate(`/association/${mockAssociationId}/member/${mockMemberId}`);
    toast.info("Logging in as demo member 'Matti Meikäläinen'.");
  };
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative">
      <ThemeToggle className="absolute top-6 right-6" />
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center gap-4">
          <Building className="w-16 h-16 text-blue-600" />
          <h1 className="text-5xl md:text-7xl font-bold font-display text-gray-900 dark:text-gray-100">
            OK Eki
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Modern management for Finnish road associations.
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
          Automate fee calculations, manage members, and bring clarity to your road maintenance responsibilities.
        </p>
        <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoginCard
            icon={Shield}
            title="Super Admin"
            description="Manage all road associations on the platform."
            onClick={handleSuperAdminLogin}
            buttonText="Login as Super Admin" />
          <LoginCard
            icon={Users}
            title="Association Admin"
            description="Manage members and settings for your association."
            onClick={handleAssociationAdminLogin}
            buttonText="Login as Admin" />
          <LoginCard
            icon={User}
            title="Member"
            description="View your information and calculated fees."
            onClick={handleMemberLogin}
            buttonText="Login as Member" />
        </div>
      </div>
       <footer className="absolute bottom-8 text-center text-muted-foreground/80">
        <p>Built with ❤�� at Cloudflare</p>
      </footer>
      <Toaster />
    </main>
  );
}
interface LoginCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  buttonText: string;
}
function LoginCard({ icon: Icon, title, description, onClick, buttonText }: LoginCardProps) {
  return (
    <Card className="text-left transform hover:-translate-y-2 transition-transform duration-300 ease-in-out hover:shadow-2xl">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
          <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button onClick={onClick} className="w-full bg-blue-600 hover:bg-blue-700">
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}