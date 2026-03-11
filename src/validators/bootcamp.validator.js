import * as yup from "yup";

export const createBootcampSchema = yup.object({
  body: yup.object({
    name: yup.string().required("Name is required"),
    description: yup.string().required("Description is required"),
    startDate: yup.date().nullable().notRequired(), // .nullable() zaroori hai agar value null aaye
    endDate: yup
      .date()
      .nullable()
      .notRequired()
      .when("startDate", {
        is: (startDate) => startDate instanceof Date && !isNaN(startDate),
        then: (schema) => schema.min(yup.ref("startDate"), "End date must be after start date"),
        otherwise: (schema) => schema,
      }),
  }),
});

export const updateBootcampSchema = yup.object({
  params: yup.object({
    id: yup.string().required("Bootcamp id is required"),
  }),
  body: yup.object({
    name: yup.string().notRequired(),
    description: yup.string().notRequired(),
    startDate: yup.date().nullable().notRequired(),
    endDate: yup
      .date()
      .nullable()
      .notRequired()
      .when("startDate", {
        is: (startDate) => startDate instanceof Date && !isNaN(startDate),
        then: (schema) => schema.min(yup.ref("startDate"), "End date must be after start date"),
        otherwise: (schema) => schema,
      }),
    status: yup
      .string()
      .oneOf(["active", "inactive", "completed", "archived"], "Invalid status")
      .notRequired(),
  }),
});

export const bootcampIdSchema = yup.object({
  params: yup.object({
    id: yup.string().required("Bootcamp id is required"),
  }),
});
