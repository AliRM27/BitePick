import { z } from "zod";

export const pickRequestSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude must be >= -90")
    .max(90, "Latitude must be <= 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180"),
  radius: z
    .number()
    .int()
    .min(500, "Radius must be at least 500 meters")
    .max(10000, "Radius must be at most 10,000 meters")
    .default(3000),
});

export type PickRequest = z.infer<typeof pickRequestSchema>;
