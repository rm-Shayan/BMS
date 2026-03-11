import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { DailyProgress } from "../models/dailyUpdate.model.js";

export const createDailyProgress = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { date, yesterdayWork, todayPlan, blockers, githubLink, hoursWorked } = req.body;

  const existing = await DailyProgress.findOne({ studentId, date });
  if (existing) {
    throw new ApiError(400, "Daily progress already submitted for this date");
  }

  const progress = await DailyProgress.create({
    studentId,
    date,
    yesterdayWork,
    todayPlan,
    blockers,
    githubLink,
    hoursWorked,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, progress, "Daily progress created successfully"));
});

export const getMyDailyProgress = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { startDate, endDate } = req.query;

  const filter = { studentId };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const progress = await DailyProgress.find(filter).sort({ date: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, progress, "Daily progress retrieved successfully"));
});

export const updateDailyProgress = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { id } = req.params;
  const updateData = req.body;

  const progress = await DailyProgress.findOneAndUpdate(
    { _id: id, studentId },
    updateData,
    { new: true },
  );

  if (!progress) throw new ApiError(404, "Progress entry not found");

  return res
    .status(200)
    .json(new ApiResponse(200, progress, "Daily progress updated successfully"));
});

export const deleteDailyProgress = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { id } = req.params;

  const deleted = await DailyProgress.findOneAndDelete({ _id: id, studentId });
  if (!deleted) throw new ApiError(404, "Progress entry not found");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Daily progress deleted successfully"));
});
