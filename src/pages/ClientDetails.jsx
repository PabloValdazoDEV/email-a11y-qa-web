import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  archiveClientRequest,
  getClientRequest,
  updateClientRequest,
} from "../api/clients.js";
import { getOrganizationRequest } from "../api/organizations.js";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { clientSchema } from "../utils/clientValidation.js";
import { getErrorMessage } from "../utils/errors.js";

export function ClientDetails() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [archiving, setArchiving] = useState(false);
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

  const loadClient = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: clientData } = await getClientRequest(clientId);
      const { data: organizationData } = await getOrganizationRequest(
        clientData.client.organizationId,
      );
      setClient(clientData.client);
      setOrganization(organizationData.organization);
      reset({ name: clientData.client.name });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cargar el cliente"));
    } finally {
      setLoading(false);
    }
  }, [clientId, reset]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  async function updateClient(values) {
    try {
      const { data } = await updateClientRequest(clientId, values);
      setClient(data.client);
      reset({ name: data.client.name });
      toast.success(data.message);
    } catch (requestError) {
      setFormError("root", {
        message: getErrorMessage(requestError, "No se pudo actualizar el cliente"),
      });
    }
  }

  async function archiveClient() {
    if (!window.confirm(`¿Quieres archivar el cliente «${client.name}»?`)) return;

    setArchiving(true);
    try {
      const { data } = await archiveClientRequest(clientId);
      toast.success(data.message);
      navigate("/organization/clients", { replace: true });
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "No se pudo archivar el cliente"));
      setArchiving(false);
    }
  }

  if (loading) return <Spinner label="Cargando cliente..." />;

  if (error || !client || !organization) {
    return (
      <div className="space-y-4">
        <Alert tone="error">{error || "Cliente no encontrado"}</Alert>
        <Link className="focus-ring inline-block rounded font-semibold text-indigo-800 underline" to="/organization/clients">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const canManage = ["OWNER", "ADMIN"].includes(organization.membership.role);

  return (
    <div className="space-y-6">
      <header>
        <Link className="focus-ring inline-block rounded text-sm font-semibold text-indigo-800 underline" to="/organization/clients">
          ← Volver a clientes
        </Link>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-indigo-700">
          {organization.name}
        </p>
        <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          {client.name}
        </h1>
        <p className="mt-2 text-sm font-semibold text-emerald-700">Activo</p>
      </header>

      {canManage ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-6" aria-labelledby="edit-client-title">
          <h2 id="edit-client-title" className="text-lg font-semibold text-zinc-950">Editar cliente</h2>
          <form onSubmit={handleSubmit(updateClient)} className="mt-4 max-w-xl space-y-4" noValidate>
            {errors.root && <Alert tone="error">{errors.root.message}</Alert>}
            <Input
              id="client-name"
              label="Nombre del cliente"
              autoComplete="organization"
              error={errors.name}
              registration={register("name")}
              disabled={isSubmitting || archiving}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="danger"
                loading={archiving}
                disabled={isSubmitting}
                onClick={archiveClient}
              >
                Archivar cliente
              </Button>
              <Button type="submit" loading={isSubmitting} disabled={archiving}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <Alert>Tu rol permite consultar este cliente, pero no modificarlo.</Alert>
      )}
    </div>
  );
}
