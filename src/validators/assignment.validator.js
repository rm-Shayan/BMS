import * as yup from "yup";

export const createAssignmentSchema = yup.object({
  params: yup.object({
    bootcampId: yup.string().trim().required("Bootcamp ID is required"),
  }),
  body: yup.object({
    title: yup.string().trim().required("Title is required"),
    description: yup.string().trim().required("Description is required"),
    domain: yup.string().trim().required("Domain is required"),
    deadline: yup.date().required("Deadline is required"),
  }),
});

export const createAssignmentWithBootcampInBodySchema = yup.object({
  body: yup.object({
    bootcampId: yup.string().trim().required("Bootcamp ID is required"),
    title: yup.string().trim().required("Title is required"),
    description: yup.string().trim().required("Description is required"),
    domain: yup.string().trim().required("Domain is required"),
    deadline: yup.date().required("Deadline is required"),
  }),
});
