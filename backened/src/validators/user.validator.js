import * as yup from "yup";

export const updateUserSchema = yup.object({
  body: yup.object({
    name: yup.string().trim().min(2, "Name is too short"),
    email: yup.string().email("Valid email required"),
    password: yup.string().min(8, "Password must be at least 8 characters"),
    domain: yup.string().trim(),
    bootcampId: yup.string().trim(),
  }),
});

export const searchUsersSchema = yup.object({
  query: yup.object({
    query: yup.string().trim(),
    page: yup.number().integer().min(1),
    limit: yup.number().integer().min(1),
  }),
});

export const updateStatusSchema = yup.object({
  params: yup.object({
    id: yup.string().required("User id is required"),
  }),
  body: yup.object({
    status: yup.string().required("Status is required"),
  }),
});

export const dropOutSchema = yup.object({
  params: yup.object({
    id: yup.string().required("User id is required"),
  }),
});

export const deleteUserSchema = yup.object({
  params: yup.object({
    id: yup.string().required("User id is required"),
  }),
});
