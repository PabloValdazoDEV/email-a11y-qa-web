import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  createCampaignRequest,
  getCampaignsRequest,
} from "../../api/campaigns.js";
import { campaignSchema } from "../../utils/campaignValidation.js";
import { getErrorMessage } from "../../utils/errors.js";
import { Alert } from "../ui/Alert.jsx";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { Spinner } from "../ui/Spinner.jsx";

export function ClientCampaigns({ clientId, canManage }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: "" },
  });

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getCampaignsRequest(clientId);
      setCampaigns(data.campaigns);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudieron cargar las campañas"));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  async function createCampaign(values) {
    try {
      const { data } = await createCampaignRequest(clientId, values);
      setCampaigns((current) => [...current, data.campaign].sort((a, b) =>
        a.name.localeCompare(b.name, "es")));
      reset();
      setShowCreateForm(false);
      toast.success(data.message);
    } catch (requestError) {
      setFormError("root", {
        message: getErrorMessage(requestError, "No se pudo crear la campaña"),
      });
    }
  }

  function cancelCreate() {
    reset();
    clearErrors();
    setShowCreateForm(false);
  }

  return (
    <section
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-6"
      aria-labelledby="campaigns-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="campaigns-title" className="text-lg font-semibold text-zinc-950">
            Campañas
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Campañas activas asociadas a este cliente.
          </p>
        </div>
        {canManage && !showCreateForm && (
          <Button type="button" onClick={() => setShowCreateForm(true)}>
            + Nueva campaña
          </Button>
        )}
      </div>

      {canManage && showCreateForm && (
        <form onSubmit={handleSubmit(createCampaign)} className="mt-5 space-y-4" noValidate>
          {errors.root && <Alert tone="error">{errors.root.message}</Alert>}
          <Input
            id="new-campaign-name"
            label="Nombre de campaña"
            error={errors.name}
            registration={register("name")}
            disabled={isSubmitting}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={cancelCreate}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Crear campaña
            </Button>
          </div>
        </form>
      )}

      <div className="mt-5">
        {loading ? (
          <Spinner label="Cargando campañas..." />
        ) : error ? (
          <Alert tone="error">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button type="button" variant="secondary" onClick={loadCampaigns}>
                Reintentar
              </Button>
            </div>
          </Alert>
        ) : campaigns.length === 0 ? (
          <Alert>No hay campañas activas para este cliente.</Alert>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" aria-label="Campañas del cliente">
            {campaigns.map((campaign) => (
              <li
                key={campaign.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <h3 className="break-words font-semibold text-zinc-950">{campaign.name}</h3>
                <Link
                  to={`/organization/clients/${clientId}/campaigns/${campaign.id}`}
                  className="focus-ring mt-3 inline-flex min-h-11 items-center rounded-lg font-semibold text-indigo-800 underline"
                >
                  Abrir campaña
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
