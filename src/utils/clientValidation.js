import { z } from "zod";

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Introduce el nombre del cliente")
    .max(120, "El nombre no puede superar los 120 caracteres"),
});
