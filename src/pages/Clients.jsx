import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { createClientRequest, getClientsRequest } from "../api/clients.js";
import { getOrganizationsRequest } from "../api/organizations.js";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { clientSchema } from "../utils/clientValidation.js";
import { getErrorMessage } from "../utils/errors.js";

export function Clients() {
  const [organization, setOrganization] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "" },
  });

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: organizationsData } = await getOrganizationsRequest();
      const currentOrganization = organizationsData.organizations[0] ?? null;
      setOrganization(currentOrganization);

      if (!currentOrganization) {
        setClients([]);
        return;
      }

      const { data: clientsData } = await getClientsRequest(currentOrganization.id);
      setClients(clientsData.clients);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudieron cargar los clientes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function createClient(values) {
    try {
      const { data } = await createClientRequest(organization.id, values);
      setClients((current) => [...current, data.client].sort((a, b) =>
        a.name.localeCompare(b.name, "es")));
      reset();
      setShowCreateForm(false);
      toast.success(data.message);
    } catch (requestError) {
      setFormError("root", {
        message: getErrorMessage(requestError, "No se pudo crear el cliente"),
      });
    }
  }

  function cancelCreate() {
    reset();
    setShowCreateForm(false);
  }

  if (loading) return <Spinner label="Cargando clientes..." />;

  if (error) {
    return (
      <Alert tone="error">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button type="button" variant="secondary" onClick={loadClients}>Reintentar</Button>
        </div>
      </Alert>
    );
  }

  if (!organization) {
    return (
      <Alert>
        Primero debes <Link className="focus-ring rounded font-semibold underline" to="/dashboard">crear una organización</Link>.
      </Alert>
    );
  }

  const canManage = ["OWNER", "ADMIN"].includes(organization.membership.role);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
            {organization.name}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Clientes
          </h1>
          <p className="mt-2 text-zinc-600">Gestiona los clientes de esta organización.</p>
        </div>
        {canManage && !showCreateForm && (
          <Button type="button" onClick={() => setShowCreateForm(true)}>
            + Nuevo cliente
          </Button>
        )}
      </header>

      {canManage && showCreateForm && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-6" aria-labelledby="new-client-title">
          <h2 id="new-client-title" className="text-lg font-semibold text-zinc-950">Nuevo cliente</h2>
          <form onSubmit={handleSubmit(createClient)} className="mt-4 max-w-xl space-y-4" noValidate>
            {errors.root && <Alert tone="error">{errors.root.message}</Alert>}
            <Input
              id="new-client-name"
              label="Nombre del cliente"
              autoComplete="organization"
              error={errors.name}
              registration={register("name")}
              disabled={isSubmitting}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={cancelCreate} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" loading={isSubmitting}>Crear cliente</Button>
            </div>
          </form>
        </section>
      )}

      {clients.length === 0 ? (
        <Alert>No hay clientes activos en esta organización.</Alert>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Clientes de la organización">
          {clients.map((client) => (
            <li key={client.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
              <div className="flex h-full flex-col gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-lg font-bold text-zinc-950">{client.name}</h2>
                  <p className="mt-2 text-xs font-semibold text-emerald-700">Activo</p>
                </div>
                <Link
                  to={`/organization/clients/${client.id}`}
                  className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Abrir cliente
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
