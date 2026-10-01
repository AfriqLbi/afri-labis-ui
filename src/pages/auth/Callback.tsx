/**
 * Auth callback page.
 *
 * With the JWT backend, there is no OIDC redirect flow — auth happens inline
 * on the sign-in page. This route exists in App.tsx for legacy compatibility.
 * It redirects to home immediately.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner.tsx";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-svh gap-4 bg-background">
      <Spinner className="size-8 text-primary" />
      <p
        className="text-sm text-muted-foreground"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        Redirecting…
      </p>
    </div>
  );
}
