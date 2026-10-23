import { z } from "zod";

export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"] as const;

/** Shared by the form (client) and the route handler (server). */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name."),
  email: z
    .string()
    .trim()
    .min(1, "We need an email to reply to.")
    .email("That doesn't look like a work email."),
  size: z.enum(COMPANY_SIZES, { message: "Pick a team size." }),
  message: z.string().trim().min(20, "A couple of sentences helps us route this: at least 20 characters.").max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const emailSchema = z.string().trim().email("Enter a valid email address.");
