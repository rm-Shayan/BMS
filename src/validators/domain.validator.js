import * as yup from "yup";

export const createDomainSchema = yup.object({
  body: yup.object({
    name: yup.string().trim().required("Name is required"),
    description: yup.string().trim().required("Description is required"),
    bootcampId: yup.string().trim().required("Bootcamp ID is required"),
    mentorId: yup.string().trim().required("Mentor ID is required"),
  }),
});

export const createDomainForBootcampSchema = yup.object({
  params: yup.object({
    bootcampId: yup.string().trim().required("Bootcamp ID is required"),
  }),
  body: yup.object({
    name: yup.string().trim().required("Name is required"),
    description: yup.string().trim().required("Description is required"),
    mentorId: yup.string().trim().required("Mentor ID is required"),
  }),
});

export const createDomainForBootcampByIdSchema = yup.object({
  params: yup.object({
    id: yup.string().trim().required("Bootcamp ID is required"),
  }),
  body: yup.object({
    name: yup.string().trim().required("Name is required"),
    description: yup.string().trim().required("Description is required"),
    mentorId: yup.string().trim().required("Mentor ID is required"),
  }),
});

export const updateDomainSchema = yup.object({
  params: yup.object({
    id: yup.string().required("Domain id is required"),
  }),
  body: yup.object({
    name: yup.string().trim().required("Name is required"),
    description: yup.string().trim().required("Description is required"),
    mentorId: yup.string().trim().required("Mentor ID is required"),
  }),
});

export const updateDomainForBootcampSchema = yup.object({
  params: yup.object({
    id: yup.string().trim().matches(/^[a-f\d]{24}$/i, "Invalid Domain ID format").required(),
  }),
  body: yup.object({
    name: yup.string().trim().required("Name is required"),
    description: yup.string().trim().required("Description is required"),
    mentorId: yup.string().trim().required("Mentor ID is required"),
    bootcampId: yup.string().trim().matches(/^[a-f\d]{24}$/i, "Invalid Bootcamp ID format").optional(),
  }),
});

export const deleteDomainSchema = yup.object({
  params: yup.object({
    id: yup.string().trim().matches(/^[a-f\d]{24}$/i, "Invalid ID format").required(),
  }),
});
