import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Introduce el nombre de la organización")
    .max(120, "El nombre no puede superar los 120 caracteres"),
});
