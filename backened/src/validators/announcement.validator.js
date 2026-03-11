import * as yup from "yup";

export const createAnnouncementSchema = yup.object({
  params: yup.object({
    bootcampId: yup.string().trim().required("Bootcamp ID is required"),
  }),
  body: yup.object({
    title: yup.string().trim().required("Title is required"),
    description: yup.string().trim().required("Description is required"),
    targetDomain: yup.string().trim().notRequired(),
  }),
});

export const updateAnnouncementSchema = yup.object({
  params: yup.object({
    bootcampId: yup.string().trim().required("Bootcamp ID is required"),
    id: yup.string().trim().required("Announcement ID is required"),
  }),
  body: yup.object({
    title: yup.string().trim().notRequired(),
    description: yup.string().trim().notRequired(),
    targetDomain: yup.string().trim().notRequired(),
  }),
});

export const createGlobalAnnouncementSchema = yup.object({
  body: yup.object({
    title: yup.string().trim().required("Title is required"),
    description: yup.string().trim().required("Description is required"),
  }),
});
