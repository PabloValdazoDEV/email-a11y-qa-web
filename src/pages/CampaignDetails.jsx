import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  archiveCampaignRequest,
  getCampaignRequest,
  updateCampaignRequest,
} from "../api/campaigns.js";
import { getClientRequest } from "../api/clients.js";
import { getOrganizationRequest } from "../api/organizations.js";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { campaignSchema } from "../utils/campaignValidation.js";
import { getErrorMessage } from "../utils/errors.js";

export function CampaignDetails() {
  const { clientId, campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
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
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: "" },
  });

  const loadCampaign = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: campaignData } = await getCampaignRequest(campaignId);
      if (campaignData.campaign.clientId !== clientId) {
        setError("Campaña no encontrada");
        return;
      }

      const { data: clientData } = await getClientRequest(campaignData.campaign.clientId);
      const { data: organizationData } = await getOrganizationRequest(
        clientData.client.organizationId,
      );
      setCampaign(campaignData.campaign);
      setClient(clientData.client);
      setOrganization(organizationData.organization);
      reset({ name: campaignData.campaign.name });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cargar la campaña"));
    } finally {
      setLoading(false);
    }
  }, [campaignId, clientId, reset]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  async function updateCampaign(values) {
    try {
      const { data } = await updateCampaignRequest(campaignId, values);
      setCampaign(data.campaign);
      reset({ name: data.campaign.name });
      toast.success(data.message);
    } catch (requestError) {
      setFormError("root", {
        message: getErrorMessage(requestError, "No se pudo actualizar la campaña"),
      });
    }
  }

  async function archiveCampaign() {
    if (!window.confirm(`¿Quieres archivar la campaña «${campaign.name}»?`)) return;

    setArchiving(true);
    try {
      const { data } = await archiveCampaignRequest(campaignId);
      toast.success(data.message);
      navigate(`/organization/clients/${client.id}`, { replace: true });
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "No se pudo archivar la campaña"));
      setArchiving(false);
    }
  }

  if (loading) return <Spinner label="Cargando campaña..." />;

  if (error || !campaign || !client || !organization) {
    return (
      <div className="space-y-4">
        <Alert tone="error">{error || "Campaña no encontrada"}</Alert>
        <Link
          className="focus-ring inline-block rounded font-semibold text-indigo-800 underline"
          to={`/organization/clients/${clientId}`}
        >
          Volver al cliente
        </Link>
      </div>
    );
  }

  const canManage = ["OWNER", "ADMIN"].includes(organization.membership.role);

  return (
    <div className="space-y-6">
      <header>
        <Link
          className="focus-ring inline-block rounded text-sm font-semibold text-indigo-800 underline"
          to={`/organization/clients/${client.id}`}
        >
          ← Volver a {client.name}
        </Link>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-indigo-700">
          Cliente: {client.name}
        </p>
        <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
          {campaign.name}
        </h1>
        <p className="mt-2 text-sm font-semibold text-emerald-700">Activa</p>
      </header>

      <Alert>Todavía no hay ningún email importado.</Alert>

      {canManage ? (
        <section
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-6"
          aria-labelledby="edit-campaign-title"
        >
          <h2 id="edit-campaign-title" className="text-lg font-semibold text-zinc-950">
            Editar campaña
          </h2>
          <form onSubmit={handleSubmit(updateCampaign)} className="mt-4 max-w-xl space-y-4" noValidate>
            {errors.root && <Alert tone="error">{errors.root.message}</Alert>}
            <Input
              id="campaign-name"
              label="Nombre de campaña"
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
                onClick={archiveCampaign}
              >
                Archivar campaña
              </Button>
              <Button type="submit" loading={isSubmitting} disabled={archiving}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <Alert>Tu rol permite consultar esta campaña, pero no modificarla.</Alert>
      )}
    </div>
  );
}
