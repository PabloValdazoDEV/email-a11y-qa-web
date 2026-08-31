import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { changePasswordRequest } from "../api/auth.js";
import { AuthCard } from "../components/auth/AuthCard.jsx";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { PasswordInput } from "../components/ui/PasswordInput.jsx";
import { useAuth } from "../context/useAuth.js";
import { getErrorMessage } from "../utils/errors.js";
import {
  changePasswordSchema,
  passwordRequirements,
} from "../utils/validation.js";

export function PasswordChangeRequired() {
  const { user, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  if (!user.passwordChangeRequired) return <Navigate to="/dashboard" replace />;

  async function onSubmit(values) {
    try {
      const { data } = await changePasswordRequest(values);
      updateCurrentUser(null);
      toast.success(data.message);
      navigate("/login", { replace: true });
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "No se pudo cambiar la contraseña") });
    }
  }

  return (
    <AuthCard
      title="Actualiza tu contraseña"
      subtitle="Han pasado 90 días desde el último cambio. Debes renovarla para continuar."
    >
      <Alert>
        La nueva contraseña no puede coincidir con ninguna de las tres últimas utilizadas.
      </Alert>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        {errors.root && <Alert tone="error">{errors.root.message}</Alert>}
        <PasswordInput
          id="required-current-password"
          label="Contraseña actual"
          autoComplete="current-password"
          registration={register("currentPassword")}
          error={errors.currentPassword}
          disabled={isSubmitting}
        />
        <PasswordInput
          id="required-new-password"
          label="Nueva contraseña"
          autoComplete="new-password"
          hint={passwordRequirements}
          registration={register("newPassword")}
          error={errors.newPassword}
          disabled={isSubmitting}
        />
        <PasswordInput
          id="required-new-password-confirm"
          label="Confirmar nueva contraseña"
          autoComplete="new-password"
          registration={register("newPasswordConfirm")}
          error={errors.newPasswordConfirm}
          disabled={isSubmitting}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Cambiar contraseña
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-600">
        ¿No recuerdas la contraseña actual?{" "}
        <Link className="focus-ring rounded font-semibold text-indigo-700 hover:underline" to="/forgot-password">
          Recuperarla por email
        </Link>
      </p>
    </AuthCard>
  );
}
