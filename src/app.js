import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan'; // Logging ke liye
import compression from 'compression'; // Performance ke liye
import helmet from 'helmet'; // Security header middleware
import { errorHandler } from './middlewares/errorHandler.middleware.js';

import adminUserRoute from "./routes/admin/user.route.js";
import adminAuthRoute from "./routes/admin/auth.route.js";
import internUserRoute from "./routes/intern/user.route.js";
import internAuthRoute from "./routes/intern/auth.route.js";
import mentorUserRoute from "./routes/mentor/user.route.js";
import mentorAuthRoute from "./routes/mentor/auth.route.js";
import adminBootcampRoute from "./routes/admin/bootcamp.route.js";
import adminAnnouncementRoute from "./routes/admin/announcement.route.js";
import adminDashboardRoute from "./routes/admin/dashboard.route.js";
import adminAssignmentRoute from "./routes/admin/assignment.route.js";
import domainRoute from "./routes/admin/domain.route.js";
import mentorDashboardRoute from "./routes/mentor/dashboard.route.js";
import mentorAssignmentRoute from "./routes/mentor/assignment.route.js";
import mentorDomainRoute from "./routes/mentor/domain.route.js";
import mentorSubmissionRoute from "./routes/mentor/submission.route.js";
import internDailyProgressRoute from "./routes/intern/dailyProgress.route.js";
import internDashboardRoute from "./routes/intern/dashboard.route.js";
import internSubmissionRoute from "./routes/intern/submission.route.js";

export const app = express();

app.use(helmet());

app.use(morgan('dev'));

app.use(compression());

const allowedOrigins = [
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cookieParser());

// Admin routes
app.use("/api/v1/auth/admin", adminAuthRoute);
app.use("/api/v1/admin", adminUserRoute);
app.use("/api/v1/admin/bootcamps", adminBootcampRoute);
app.use("/api/v1/admin/bootcamp/announcements", adminAnnouncementRoute);
app.use("/api/v1/admin/bootcamp/dashboard", adminDashboardRoute);
app.use("/api/v1/admin/bootcamp/assignments", adminAssignmentRoute);
app.use("/api/v1/admin/bootcamp/domains", domainRoute);

// Student (intern) routes
app.use("/api/v1/auth/student", internAuthRoute);
app.use("/api/v1/student", internUserRoute);
app.use("/api/v1/student/bootcamp/daily-progress", internDailyProgressRoute);
app.use("/api/v1/student/bootcamp/submissions", internSubmissionRoute);
app.use("/api/v1/student/bootcamp/dashboard", internDashboardRoute);

// Mentor routes
app.use("/api/v1/auth/mentor", mentorAuthRoute);
app.use("/api/v1/mentor", mentorUserRoute);
app.use("/api/v1/mentor/bootcamp/dashboard", mentorDashboardRoute);
app.use("/api/v1/mentor/bootcamp/domains", mentorDomainRoute);
app.use("/api/v1/mentor/bootcamp/assignments", mentorAssignmentRoute);
app.use("/api/v1/mentor/bootcamp/submissions", mentorSubmissionRoute);


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is up and running!",
  });
});

// ------- Error Handle Middleware ------
app.use(errorHandler)