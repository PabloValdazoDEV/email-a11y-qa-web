import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { resetPasswordRequest } from "../api/auth.js";
import { AuthCard } from "../components/auth/AuthCard.jsx";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { PasswordInput } from "../components/ui/PasswordInput.jsx";
import { getErrorMessage } from "../utils/errors.js";
import { takeTokenFromHash } from "../utils/hashToken.js";
import { passwordRequirements, resetPasswordSchema } from "../utils/validation.js";

export function ResetPassword() {
  const [token] = useState(takeTokenFromHash);
  const [completed, setCompleted] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values) {
    if (!token) return;
    try {
      await resetPasswordRequest({ token, ...values });
      setCompleted(true);
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "El enlace no es válido o ha caducado.") });
    }
  }

  if (!token) {
    return (
      <AuthCard title="Enlace no válido">
        <Alert tone="error">El enlace no es válido o ha caducado.</Alert>
        <Link to="/forgot-password" className="focus-ring mt-6 block rounded text-center font-semibold text-indigo-700 hover:underline">
          Solicitar uno nuevo
        </Link>
      </AuthCard>
    );
  }

  if (completed) {
    return (
      <AuthCard title="Contraseña actualizada">
        <Alert tone="success">Ya puedes iniciar sesión con tu nueva contraseña.</Alert>
        <Link to="/login" className="focus-ring mt-6 block rounded text-center font-semibold text-indigo-700 hover:underline">
          Ir a iniciar sesión
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Crea una nueva contraseña">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root && <Alert tone="error">{errors.root.message}</Alert>}
        <PasswordInput
          id="password"
          label="Nueva contraseña"
          autoComplete="new-password"
          hint={passwordRequirements}
          error={errors.password}
          registration={register("password")}
          disabled={isSubmitting}
        />
        <PasswordInput
          id="passwordConfirm"
          label="Confirmar contraseña"
          autoComplete="new-password"
          error={errors.passwordConfirm}
          registration={register("passwordConfirm")}
          disabled={isSubmitting}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Guardar contraseña
        </Button>
      </form>
    </AuthCard>
  );
}
