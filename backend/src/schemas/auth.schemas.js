import { z } from "zod";
import {
  getInstitutionalDomain,
  isInstitutionalEmail,
  normalizeEmail
} from "../utils/credentials.js";

const institutionalEmailSchema = z
  .string()
  .trim()
  .email("El correo no tiene un formato válido.")
  .transform(normalizeEmail)
  .refine((email) => isInstitutionalEmail(email), {
    message: `El correo debe pertenecer al dominio @${getInstitutionalDomain()}.`
  });

const passwordSchema = z.string().min(1).max(128);

export const loginSchema = z.object({
  email: institutionalEmailSchema,
  password: passwordSchema
});

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema
});

export const createUserSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  email: institutionalEmailSchema,
  temporaryPassword: passwordSchema,
  rolId: z.coerce.number().int().positive(),
  ambitoId: z.coerce.number().int().positive()
});

export const updateUserSchema = z
  .object({
    nombre: z.string().trim().min(2).max(120).optional(),
    rolId: z.coerce.number().int().positive().optional(),
    ambitoId: z.coerce.number().int().positive().optional()
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Debe indicar al menos un campo para actualizar."
  });

export const updateUserStatusSchema = z.object({
  activo: z.boolean()
});

export const userIdParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});
