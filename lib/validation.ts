import { z } from "zod"

// Common validation schemas
export const emailSchema = z.string().email("Invalid email address").max(255)
export const phoneSchema = z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number")
export const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100)
export const nameSchema = z.string().min(1, "Required").max(100, "Too long")
export const dateSchema = z.string().refine((date) => {
  const d = new Date(date)
  return !isNaN(d.getTime())
}, "Invalid date")

// Student validation
export const studentValidationSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required").max(50),
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: dateSchema,
  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
  }),
  bloodGroup: z.string().max(10).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  phone: phoneSchema.optional().or(z.literal("")),
  email: emailSchema.optional().or(z.literal("")),
  parentPhone: phoneSchema.optional().or(z.literal("")),
  parentEmail: emailSchema.optional().or(z.literal("")),
  classId: z.string().cuid().optional(),
  sectionId: z.string().cuid().optional(),
})

// Login validation
export const loginValidationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

// Class validation
export const classValidationSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100),
  level: z.number().int().min(1).max(20).optional(),
  capacity: z.number().int().min(1).max(1000).default(40),
  status: z.enum(["active", "inactive"]).default("active"),
})

// Staff validation
export const staffValidationSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required").max(50),
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  designation: z.string().min(1, "Designation is required"),
  department: z.string().max(100).optional(),
  joiningDate: dateSchema,
  salary: z.number().positive().optional(),
  status: z.enum(["active", "on_leave", "terminated", "inactive"]).default("active"),
})

