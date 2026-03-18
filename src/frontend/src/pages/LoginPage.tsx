import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { CloudMoon, Star, Telescope } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) navigate({ to: "/" });
  }, [identity, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card border border-border rounded-xl p-8 card-glow text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center glow-blue">
              <Telescope className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">
              SeeStar Logger
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track your telescope observing sessions
            </p>
          </div>
          <div className="flex justify-center gap-4 text-muted-foreground">
            <div className="flex flex-col items-center gap-1">
              <Star className="w-5 h-5 text-gold" />
              <span className="text-xs">Rate targets</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CloudMoon className="w-5 h-5 text-primary" />
              <span className="text-xs">Log conditions</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Telescope className="w-5 h-5 text-accent" />
              <span className="text-xs">Track sessions</span>
            </div>
          </div>
          <Button
            className="w-full bg-primary text-primary-foreground hover:opacity-90 glow-blue"
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="login.primary_button"
          >
            {isLoggingIn ? "Signing in…" : "Sign In to Continue"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Secured by Internet Identity
          </p>
        </div>
      </motion.div>
    </div>
  );
}
