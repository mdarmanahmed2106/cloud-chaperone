import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Shield, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_600px_at_10%_-10%,hsl(var(--primary)/0.15),transparent_60%),radial-gradient(1000px_500px_at_90%_-20%,hsl(var(--accent)/0.12),transparent_60%),linear-gradient(to_bottom_right,hsl(var(--background)),hsl(var(--background)))]">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-180px] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-[40%] bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--primary)/0.08),hsl(var(--accent)/0.08),transparent_60%)] blur-2xl" />

      <div className="relative container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-primary to-primary-glow p-6 rounded-3xl shadow-glow">
                <Upload className="w-20 h-20 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Mini Drive
            </h1>
            <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
              Your personal cloud storage solution. Upload, manage, and share your files securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full mt-12">
            <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-card">
              <div className="bg-gradient-to-br from-primary/10 to-primary-glow/10 p-4 rounded-2xl inline-block mb-4 border border-primary/20">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Upload</h3>
              <p className="text-muted-foreground">
                Drag and drop or click to upload your files instantly
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-card">
              <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-4 rounded-2xl inline-block mb-4 border border-accent/20">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Storage</h3>
              <p className="text-muted-foreground">
                Your files are encrypted and protected with enterprise-grade security
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-card to-card/80 border border-border/50 shadow-card">
              <div className="bg-gradient-to-br from-primary-glow/10 to-accent/10 p-4 rounded-2xl inline-block mb-4 border border-primary-glow/20">
                <FileCheck className="w-8 h-8 text-primary-glow" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Management</h3>
              <p className="text-muted-foreground">
                View, organize, and manage all your files in one place
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="mt-8 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity text-lg px-8 py-6 shadow-elegant"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
