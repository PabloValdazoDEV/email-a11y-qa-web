import { useCallback, useEffect, useState } from "react";
import { getOrganizationsRequest } from "../api/organizations.js";
import { CreateOrganizationForm } from "../components/organizations/CreateOrganizationForm.jsx";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { useAuth } from "../context/useAuth.js";
import { getErrorMessage } from "../utils/errors.js";

export function Dashboard() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getOrganizationsRequest();
      setOrganizations(data.organizations);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cargar tu organización"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  if (loading) return <Spinner label="Cargando organización..." />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="break-words text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          Bienvenido, {user.name}
        </h1>
        <p className="mt-2 text-zinc-600">Gestiona el espacio de trabajo de tu equipo.</p>
      </header>

      {error && (
        <Alert tone="error">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button type="button" variant="secondary" onClick={loadOrganizations}>
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      {!error && organizations.length === 0 && (
        <CreateOrganizationForm onCreated={(organization) => setOrganizations([organization])} />
      )}

      {!error && organizations.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
            Tu organización
          </p>
          <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-zinc-950">
            {organizations[0].name}
          </h2>
          <p className="mt-3 text-zinc-600">
            Tu rol: {organizations[0].membership.role}
          </p>
        </section>
      )}
    </div>
  );
}
