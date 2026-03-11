import * as yup from "yup";

export const createDailyProgressSchema = yup.object({
  body: yup.object({
    date: yup.date().required("Date is required"),
    yesterdayWork: yup.string().required("Yesterday's work is required"),
    todayPlan: yup.string().required("Today's plan is required"),
    blockers: yup.string().notRequired(),
    githubLink: yup.string().url("Must be a valid URL").notRequired(),
    hoursWorked: yup
      .number()
      .min(0, "Hours must be >= 0")
      .max(24, "Hours must be <= 24")
      .required("Hours worked is required"),
  }),
});

export const updateDailyProgressSchema = yup.object({
  params: yup.object({
    id: yup.string().trim().required("Daily progress ID is required"),
  }),
  body: yup.object({
    date: yup.date().notRequired(),
    yesterdayWork: yup.string().notRequired(),
    todayPlan: yup.string().notRequired(),
    blockers: yup.string().notRequired(),
    githubLink: yup.string().url("Must be a valid URL").notRequired(),
    hoursWorked: yup
      .number()
      .min(0, "Hours must be >= 0")
      .max(24, "Hours must be <= 24")
      .notRequired(),
  }),
});
