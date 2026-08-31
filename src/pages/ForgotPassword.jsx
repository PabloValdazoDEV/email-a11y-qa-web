import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../api/auth.js";
import { AuthCard } from "../components/auth/AuthCard.jsx";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { getErrorMessage } from "../utils/errors.js";
import { emailSchema } from "../utils/validation.js";

const publicMessage =
  "Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer la contraseña.";

export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(emailSchema) });

  async function onSubmit(values) {
    try {
      await forgotPasswordRequest(values);
      setSent(true);
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  }

  return (
    <AuthCard title="Recupera tu contraseña" subtitle="Te enviaremos un enlace de un solo uso.">
      {sent ? (
        <Alert tone="success">{publicMessage}</Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {errors.root && <Alert tone="error">{errors.root.message}</Alert>}
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email}
            registration={register("email")}
            disabled={isSubmitting}
          />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Enviar enlace
          </Button>
        </form>
      )}
      <Link to="/login" className="focus-ring mt-6 block rounded text-center text-sm text-indigo-700 hover:underline">
        Volver a iniciar sesión
      </Link>
    </AuthCard>
  );
}
