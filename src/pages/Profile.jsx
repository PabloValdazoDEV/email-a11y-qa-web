import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { changePasswordRequest, updateProfileRequest } from "../api/auth.js";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { PasswordInput } from "../components/ui/PasswordInput.jsx";
import { useAuth } from "../context/useAuth.js";
import { getErrorMessage } from "../utils/errors.js";
import {
  changePasswordSchema,
  passwordRequirements,
  profileSchema,
} from "../utils/validation.js";

export function Profile() {
  const { user, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      currentPassword: "",
    },
  });
  const passwordForm = useForm({ resolver: zodResolver(changePasswordSchema) });
  const currentEmail = profileForm.watch("email");
  const emailChanged = currentEmail.trim().toLowerCase() !== user.email;

  async function saveProfile(values) {
    if (emailChanged && !values.currentPassword) {
      profileForm.setError("currentPassword", {
        message: "Introduce tu contraseña actual para cambiar el email",
      });
      return;
    }
    try {
      const { data } = await updateProfileRequest({
        ...values,
        currentPassword: values.currentPassword || undefined,
      });
      if (data.sessionRevoked) {
        updateCurrentUser(null);
        toast.success(data.message);
        navigate("/login", { replace: true });
        return;
      }
      updateCurrentUser(data.user);
      profileForm.reset({ ...data.user, currentPassword: "" });
      toast.success("Perfil actualizado");
    } catch (error) {
      profileForm.setError("root", { message: getErrorMessage(error) });
    }
  }

  async function savePassword(values) {
    try {
      const { data } = await changePasswordRequest(values);
      updateCurrentUser(null);
      toast.success(data.message);
      navigate("/login", { replace: true });
    } catch (error) {
      passwordForm.setError("root", { message: getErrorMessage(error) });
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Perfil</h1>
        <p className="mt-2 text-zinc-600">Gestiona tus datos personales y tu contraseña.</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-6">
        <h2 className="text-xl font-bold">Datos personales</h2>
        <form onSubmit={profileForm.handleSubmit(saveProfile)} className="mt-5 max-w-2xl space-y-4" noValidate>
          {profileForm.formState.errors.root && (
            <Alert tone="error">{profileForm.formState.errors.root.message}</Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="profile-name"
              label="Nombre"
              autoComplete="given-name"
              registration={profileForm.register("name")}
              error={profileForm.formState.errors.name}
              disabled={profileForm.formState.isSubmitting}
            />
            <Input
              id="profile-lastName"
              label="Apellidos"
              autoComplete="family-name"
              registration={profileForm.register("lastName")}
              error={profileForm.formState.errors.lastName}
              disabled={profileForm.formState.isSubmitting}
            />
          </div>
          <Input
            id="profile-email"
            label="Email"
            type="email"
            autoComplete="email"
            registration={profileForm.register("email")}
            error={profileForm.formState.errors.email}
            disabled={profileForm.formState.isSubmitting}
          />
          {emailChanged && (
            <PasswordInput
              id="profile-currentPassword"
              label="Contraseña actual"
              autoComplete="current-password"
              hint="Cambiar el email requiere verificarlo de nuevo y cerrará tus sesiones."
              registration={profileForm.register("currentPassword")}
              error={profileForm.formState.errors.currentPassword}
              disabled={profileForm.formState.isSubmitting}
            />
          )}
          <Button type="submit" loading={profileForm.formState.isSubmitting} className="w-full sm:w-auto">
            Guardar perfil
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-card sm:p-6">
        <h2 className="text-xl font-bold">Cambiar contraseña</h2>
        <p className="mt-1 text-sm text-zinc-600">
          No puede coincidir con ninguna de las tres últimas. Caducará en 90 días y se cerrarán todas tus sesiones.
        </p>
        <form onSubmit={passwordForm.handleSubmit(savePassword)} className="mt-5 max-w-2xl space-y-4" noValidate>
          {passwordForm.formState.errors.root && (
            <Alert tone="error">{passwordForm.formState.errors.root.message}</Alert>
          )}
          <PasswordInput
            id="change-currentPassword"
            label="Contraseña actual"
            autoComplete="current-password"
            registration={passwordForm.register("currentPassword")}
            error={passwordForm.formState.errors.currentPassword}
            disabled={passwordForm.formState.isSubmitting}
          />
          <PasswordInput
            id="change-newPassword"
            label="Nueva contraseña"
            autoComplete="new-password"
            hint={passwordRequirements}
            registration={passwordForm.register("newPassword")}
            error={passwordForm.formState.errors.newPassword}
            disabled={passwordForm.formState.isSubmitting}
          />
          <PasswordInput
            id="change-newPasswordConfirm"
            label="Confirmar nueva contraseña"
            autoComplete="new-password"
            registration={passwordForm.register("newPasswordConfirm")}
            error={passwordForm.formState.errors.newPasswordConfirm}
            disabled={passwordForm.formState.isSubmitting}
          />
          <Button type="submit" loading={passwordForm.formState.isSubmitting} className="w-full sm:w-auto">
            Cambiar contraseña
          </Button>
        </form>
      </section>
    </div>
  );
}
