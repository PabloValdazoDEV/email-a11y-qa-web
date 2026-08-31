import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { verifyEmailRequest } from "../api/auth.js";
import { AuthCard } from "../components/auth/AuthCard.jsx";
import { Alert } from "../components/ui/Alert.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { takeTokenFromHash } from "../utils/hashToken.js";

export function VerifyEmail() {
  const [token] = useState(takeTokenFromHash);
  const [status, setStatus] = useState(token ? "loading" : "error");

  useEffect(() => {
    if (!token) return;
    verifyEmailRequest({ token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <AuthCard title="Verificación de email">
      {status === "loading" && <Spinner label="Verificando..." />}
      {status === "success" && <Alert tone="success">Email verificado correctamente.</Alert>}
      {status === "error" && <Alert tone="error">El enlace no es válido o ha caducado.</Alert>}
      {status !== "loading" && (
        <Link to="/login" className="focus-ring mt-6 block rounded text-center font-semibold text-indigo-700 hover:underline">
          Ir a iniciar sesión
        </Link>
      )}
    </AuthCard>
  );
}
