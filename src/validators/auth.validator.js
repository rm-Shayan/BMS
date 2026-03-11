import * as yup from "yup";

export const loginSchema = yup.object({
  body: yup.object({
    email: yup.string().email("Valid email required").required("Email is required"),
    password: yup.string().required("Password is required"),
  }),
});

export const forgotPasswordSchema = yup.object({
  body: yup.object({
    email: yup.string().email("Valid email required").required("Email is required"),
  }),
});

export const resetPasswordSchema = yup.object({
  body: yup.object({
    email: yup.string().email("Valid email required").required("Email is required"),
    otp: yup.string().required("OTP is required"),
    password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
  }),
});


export const createUserSchema = yup.object({
  body: yup.object({
    name: yup.string().trim().when("$file", {
      is: (file) => !file,
      then: (schema) => schema.required("Name is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    email: yup.string().email("Valid email required").when("$file", {
      is: (file) => !file,
      then: (schema) => schema.required("Email is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    password: yup.string().min(8, "Password must be at least 8 characters").when("$file", {
      is: (file) => !file,
      then: (schema) => schema.required("Password is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    role: yup.string().oneOf(["admin", "mentor", "student"]),
// user.validator.js
domain: yup.string()
  .trim()
  .nullable() 
  .notRequired(),
    bootcampId: yup.string().trim(),
  }),
});
