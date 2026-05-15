import { z } from "zod";

export const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1, "Viatura é obrigatória"),
  driverId: z.string().min(1, "Condutor é obrigatório"),
  gasolina: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v === null ? null : Number(v)),
    z.number().positive("Deve ser positivo").optional().nullable()
  ),
  gasoleo: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v === null ? null : Number(v)),
    z.number().positive("Deve ser positivo").optional().nullable()
  ),
  data: z.preprocess(
    (v) => (typeof v === "string" || v instanceof Date ? new Date(v as string) : v),
    z.date({ message: "Data inválida" })
  ),
  hora: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export const updateFuelLogSchema = createFuelLogSchema.partial();

export type CreateFuelLogDTO = z.infer<typeof createFuelLogSchema>;
export type UpdateFuelLogDTO = z.infer<typeof updateFuelLogSchema>;

export const logFiltersSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  vehicleType: z.string().optional(),
  matricula: z.string().optional(),
  driverName: z.string().optional(),
  nMec: z.string().optional(),
  area: z.string().optional(),
  fuelType: z.enum(["gasolina", "gasoleo", "all"]).default("all"),
  search: z.string().optional(),
});

export type LogFilters = z.infer<typeof logFiltersSchema>;
