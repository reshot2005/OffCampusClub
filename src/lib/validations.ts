import { z } from "zod";

const indianPhoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    collegeName: z.string().min(2, "College name must be at least 2 characters").optional(),
    phoneNumber: z
      .string()
      .regex(indianPhoneRegex, "Enter a valid Indian phone number")
      .transform((value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length > 10 ? digits.slice(-10) : digits;
      })
      .optional(),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/\d/, "Password must include a number"),
    confirmPassword: z.string(),
    acceptedTerms: z.boolean().optional(),
    otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/\d/, "Password must include a number"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

/** PATCH /api/profile — email and phone are not accepted (read-only on account). */
export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  collegeName: z.string().min(2, "College name is required"),
  bio: z.string().max(280, "Bio must be 280 characters or less").optional().or(z.literal("")),
  city: z.string().max(80, "City is too long").optional().or(z.literal("")),
  graduationYear: z.union([z.number().int().min(2020).max(2040), z.null()]).optional(),
  avatar: z
    .union([
      z.literal(""),
      z
        .string()
        .max(8000)
        .regex(/^(\/|https?:\/\/|data:image\/)/, "Invalid avatar URL"),
    ])
    .optional(),
});

/** @deprecated Use profileUpdateSchema — kept as alias for imports. */
export const profileSchema = profileUpdateSchema;

export const joinClubSchema = z.object({
  clubId: z.string().cuid(),
});

export const eventRegistrationSchema = z.object({
  eventId: z.string().cuid(),
});

export const gigApplicationSchema = z.object({
  gigId: z.string().cuid(),
  message: z.string().max(50).optional().or(z.literal("")),
  applicantName: z.string().min(2).max(120).optional(),
  applicantPhone: z.string().min(10).max(20).optional(),
  applicantEmail: z.string().email().max(200).optional(),
});

export const gigCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(8000),
  payMin: z.number().int().min(0),
  payMax: z.number().int().min(0),
  deadline: z.string().optional().nullable(),
});

export const gigUpdateSchema = gigCreateSchema;

export const gigApplicationReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const postCreateSchema = z.object({
  clubId: z.string().min(1),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).max(4).optional(),
  caption: z.string().max(2000).optional(),
  content: z.string().max(5000).optional(),
  type: z.string().optional(),
});

/** Allowed in DB: full https URL, site-relative path (e.g. /uploads/...), or "" to clear. */
export const postStoredImageUrlSchema = z.string().max(2048).refine(
  (s) =>
    s === "" ||
    /^https?:\/\//i.test(s) ||
    (s.startsWith("/") && s.length > 1 && !s.startsWith("//")),
  { message: "Image must be https URL, a path starting with /, or empty" },
);

export const postUpdateSchema = z.object({
  caption: z.string().max(2000).optional().nullable(),
  content: z.string().max(5000).optional().nullable(),
  imageUrl: z.union([postStoredImageUrlSchema, z.null()]).optional(),
  type: z.string().optional(),
});

/** Normalizes to last 10 digits; validates Indian mobile (starts 6–9). */
const clubHeaderPhoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  })
  .refine((digits) => /^[6-9]\d{9}$/.test(digits), {
    message: "Enter a valid 10-digit Indian mobile number",
  });

export const clubHeaderRegisterSchema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phoneNumber: clubHeaderPhoneSchema,
    collegeName: z.string().min(2),
    clubSlug: z.string().min(2),
    experience: z
      .string()
      .trim()
      .min(3, "Please add a short note about why you want to lead (at least 3 characters).")
      .max(2000),
    instagramHandle: z.string().optional().or(z.literal("")),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const referralValidateSchema = z.object({
  code: z.string().min(4),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileInput = ProfileUpdateInput;
