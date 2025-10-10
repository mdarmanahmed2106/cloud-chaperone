import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Upload, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
}

const Layout = ({ children, isAdmin }: LayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout Failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur supports-[backdrop-filter]:bg-primary/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left Section: Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/30 shadow-[var(--shadow-elegant)]">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))]">
                Mini Drive
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Personal Cloud Storage</p>
            </div>

            {isAdmin && (
              <div className="ml-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Admin</span>
              </div>
            )}
          </div>

          {/* Right Section: Logout */}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-6 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-gradient-to-r from-transparent via-primary/5 to-transparent py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Mini Drive — All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
