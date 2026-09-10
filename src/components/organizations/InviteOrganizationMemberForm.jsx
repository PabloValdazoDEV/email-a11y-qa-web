import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { createOrganizationInvitationRequest } from "../../api/organizations.js";
import { getErrorMessage } from "../../utils/errors.js";
import { organizationInvitationSchema } from "../../utils/organizationValidation.js";
import { Alert } from "../ui/Alert.jsx";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";

const rolesByActor = Object.freeze({
  OWNER: ["ADMIN", "EDITOR", "VIEWER"],
  ADMIN: ["EDITOR", "VIEWER"],
});

export function InviteOrganizationMemberForm({ organizationId, actorRole, onInvited }) {
  const roles = rolesByActor[actorRole] ?? [];
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(organizationInvitationSchema),
    defaultValues: {
      name: "",
      lastName: "",
      email: "",
      role: roles.includes("EDITOR") ? "EDITOR" : roles[0],
    },
  });

  if (roles.length === 0) return null;

  async function onSubmit(values) {
    try {
      const { data } = await createOrganizationInvitationRequest(organizationId, values);
      if (data.invitationSent === false) {
        toast.error(data.message, { duration: 7000 });
      } else {
        toast.success(data.message);
      }
      reset({ name: "", lastName: "", email: "", role: roles.includes("EDITOR") ? "EDITOR" : roles[0] });
      onInvited(data.member);
    } catch (error) {
      setError("root", {
        message: getErrorMessage(error, "No se pudo invitar a la persona"),
      });
    }
  }

  return (
    <section
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-6"
      aria-labelledby="invite-member-title"
    >
      <div className="mb-5">
        <h2 id="invite-member-title" className="text-lg font-semibold text-zinc-950">
          Invitar usuario
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600">
          Si la cuenta no existe, enviaremos un enlace seguro para crear su contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        {errors.root && (
          <Alert tone="error" className="sm:col-span-2">
            {errors.root.message}
          </Alert>
        )}
        <Input
          id="invited-member-name"
          label="Nombre"
          autoComplete="off"
          hint="Se utilizará solamente si hay que crear una cuenta nueva."
          error={errors.name}
          registration={register("name")}
          disabled={isSubmitting}
        />
        <Input
          id="invited-member-last-name"
          label="Apellidos"
          autoComplete="off"
          error={errors.lastName}
          registration={register("lastName")}
          disabled={isSubmitting}
        />
        <Input
          id="invited-member-email"
          label="Email"
          type="email"
          autoComplete="off"
          error={errors.email}
          registration={register("email")}
          disabled={isSubmitting}
        />
        <div className="min-w-0">
          <label htmlFor="invited-member-role" className="mb-1.5 block text-sm font-medium text-zinc-800">
            Rol en la organización
          </label>
          <select
            id="invited-member-role"
            {...register("role")}
            disabled={isSubmitting}
            className="focus-ring min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 disabled:bg-zinc-100"
          >
            {roles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          {errors.role && <p role="alert" className="mt-1.5 text-sm text-red-700">{errors.role.message}</p>}
        </div>
        <div className="sm:col-span-2 sm:flex sm:justify-end">
          <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
            Invitar usuario
          </Button>
        </div>
      </form>
    </section>
  );
}
