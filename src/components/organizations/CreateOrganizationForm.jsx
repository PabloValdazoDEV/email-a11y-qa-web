import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { createOrganizationRequest } from "../../api/organizations.js";
import { getErrorMessage } from "../../utils/errors.js";
import { createOrganizationSchema } from "../../utils/organizationValidation.js";
import { Alert } from "../ui/Alert.jsx";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";

export function CreateOrganizationForm({ onCreated }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values) {
    try {
      const { data } = await createOrganizationRequest(values);
      reset();
      onCreated(data.organization);
      toast.success("Organización creada");
    } catch (error) {
      setError("root", {
        message: getErrorMessage(error, "No se pudo crear la organización"),
      });
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
        Primer paso
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
        Crea tu organización
      </h2>
      <p className="mt-2 max-w-2xl text-zinc-600">
        Será el espacio donde trabajará tu equipo. Tú quedarás registrado como propietario.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-xl space-y-4" noValidate>
        {errors.root && <Alert tone="error">{errors.root.message}</Alert>}
        <Input
          id="organization-name"
          label="Nombre de la organización"
          autoComplete="organization"
          registration={register("name")}
          error={errors.name}
          disabled={isSubmitting}
        />
        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
          Crear organización
        </Button>
      </form>
    </section>
  );
}
