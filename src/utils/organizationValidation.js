import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Introduce el nombre de la organización")
    .max(120, "El nombre no puede superar los 120 caracteres"),
});

const invitedPersonName = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio")
  .max(80, "No puede superar los 80 caracteres");

export const organizationInvitationSchema = z.object({
  name: invitedPersonName,
  lastName: invitedPersonName,
  email: z
    .string()
    .trim()
    .min(1, "Introduce un email")
    .max(254, "El email es demasiado largo")
    .email("Introduce un email válido"),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});
