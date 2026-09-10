import { z } from "zod";

export const campaignSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre de la campaña es obligatorio")
      .max(120, "El nombre de la campaña es demasiado largo"),
  })
  .strict();
