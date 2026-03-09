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

export const app = express();

app.use(helmet());

app.use(morgan('dev')); 

app.use(compression());

const allowedOrigins = [
  "http://localhost:5173"
];

app.use(cors({
  origin: function(origin, callback) {
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

// Student (intern) routes
app.use("/api/v1/auth/student", internAuthRoute);
app.use("/api/v1/student", internUserRoute);

// Mentor routes
app.use("/api/v1/auth/mentor", mentorAuthRoute);
app.use("/api/v1/mentor", mentorUserRoute);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is up and running!",
  });
});

// ------- Error Handle Middleware ------
app.use(errorHandler)