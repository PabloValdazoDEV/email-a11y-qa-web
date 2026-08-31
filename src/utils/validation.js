import { z } from "zod";

export const passwordRequirements =
  "Minimo 7 caracteres, con mayúscula, minúscula, número y símbolo.";

export function isStrongPassword(password) {
  return (
    password.length >= 7 &&
    password.length <= 64 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

const email = z.string().trim().email("Introduce un email válido").max(254);
const password = z.string().refine(isStrongPassword, passwordRequirements);
const name = z.string().trim().min(1, "Este campo es obligatorio").max(80);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Introduce tu contraseña").max(128),
  rememberMe: z.boolean().default(false),
});

export const emailSchema = z.object({ email });

export const createUserSchema = z.object({
  name,
  lastName: name,
  email,
  role: z.enum(["USER", "ADMIN", "SUPERADMIN"]),
});

export const resetPasswordSchema = z
  .object({ password, passwordConfirm: z.string() })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirm"],
  });

export const profileSchema = z.object({
  name,
  lastName: name,
  email,
  currentPassword: z.string().max(128).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Introduce tu contraseña actual").max(128),
    newPassword: password,
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "Las contraseñas no coinciden",
    path: ["newPasswordConfirm"],
  });
