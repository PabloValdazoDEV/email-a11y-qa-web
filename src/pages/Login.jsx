import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthCard } from "../components/auth/AuthCard.jsx";
import { Alert } from "../components/ui/Alert.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { PasswordInput } from "../components/ui/PasswordInput.jsx";
import { useAuth } from "../context/useAuth.js";
import { getErrorMessage } from "../utils/errors.js";
import { loginSchema } from "../utils/validation.js";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { rememberMe: false } });

  async function onSubmit(values) {
    try {
      const user = await login(values);
      if (user.passwordChangeRequired) {
        toast("Tu contraseña ha caducado y debes actualizarla.");
        navigate("/password-change-required", { replace: true });
        return;
      }
      toast.success("Sesión iniciada");
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "No se pudo iniciar sesión") });
    }
  }

  return (
    <AuthCard title="Inicia sesión" subtitle="Accede de forma segura a tu cuenta.">
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
        <PasswordInput
          id="password"
          label="Contraseña"
          autoComplete="current-password"
          error={errors.password}
          registration={register("password")}
          disabled={isSubmitting}
        />
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            className="focus-ring h-4 w-4 rounded border-zinc-300 text-indigo-700"
            {...register("rememberMe")}
            disabled={isSubmitting}
          />
          Recordarme
        </label>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Iniciar sesión
        </Button>
      </form>
      <div className="mt-6 space-y-2 text-center text-sm">
        <Link className="focus-ring rounded text-indigo-700 hover:underline" to="/forgot-password">
          ¿Has olvidado tu contraseña?
        </Link>
      </div>
    </AuthCard>
  );
}
