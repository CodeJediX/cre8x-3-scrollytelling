import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.url()]).optional();
export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120), email: z.email(), phone: z.string().trim().min(7).max(30),
  university: z.string().trim().min(2).max(160), faculty: z.string().trim().min(2).max(160), degree: z.string().trim().min(2).max(160),
  academicYear: z.string().trim().min(1).max(30), studentId: z.string().trim().min(2).max(80),
  linkedinUrl: optionalUrl, portfolioUrl: optionalUrl, behanceUrl: optionalUrl, figmaUrl: optionalUrl,
  undergraduateConfirmed: z.literal(true), rulesAccepted: z.literal(true), privacyAccepted: z.literal(true)
});
export const soloRegistrationSchema = profileSchema.extend({ mode: z.literal("solo") });
export const teamCreationSchema = profileSchema.extend({ mode: z.literal("create_team"), teamName: z.string().trim().min(2).max(100), teamSize: z.coerce.number().int().min(1).max(4) });
export const teamJoinSchema = profileSchema.extend({ mode: z.literal("join_team"), inviteCode: z.string().trim().toUpperCase().regex(/^CRX3-[A-Z0-9]{6}$/) });
