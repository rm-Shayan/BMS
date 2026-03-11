import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Submission } from "../models/submission.model.js";
import { Assignment } from "../models/assignment.model.js";
import cache from "../config/cache.js";

export const submitAssignment = asyncHandler(async (req, res) => {
    const { assignmentId, submissionLink, notes } = req.body;
    const studentId = req.user._id;

    if (!assignmentId || !submissionLink) {
        throw new ApiError(400, "Assignment ID and Submission Link are required");
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new ApiError(404, "Assignment not found");

    // Check if deadline passed
    if (new Date() > new Date(assignment.deadline)) {
        throw new ApiError(400, "Submission deadline has passed");
    }

    const submission = await Submission.findOneAndUpdate(
        { assignmentId, studentId },
        { submissionLink, notes, status: "pending", submittedAt: new Date() },
        { upsert: true, new: true }
    );

    return res.status(201).json(new ApiResponse(201, submission, "Assignment submitted successfully"));
});

export const getSubmissions = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { studentId, status } = req.query;

    const filter = {};
    if (assignmentId) filter.assignmentId = assignmentId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const submissions = await Submission.find(filter)
        .populate("studentId", "name email")
        .populate("assignmentId", "title");

    return res.status(200).json(new ApiResponse(200, submissions, "Submissions retrieved successfully"));
});

export const getMySubmissions = asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const submissions = await Submission.find({ studentId }).populate("assignmentId", "title deadline");

    return res.status(200).json(new ApiResponse(200, submissions, "Your submissions retrieved successfully"));
});

export const reviewSubmission = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, feedback, score } = req.body;

    if (!["accepted", "rejected", "reviewed"].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const submission = await Submission.findByIdAndUpdate(
        id,
        { status, feedback, score },
        { new: true }
    );

    if (!submission) throw new ApiError(404, "Submission not found");

    return res.status(200).json(new ApiResponse(200, submission, "Submission reviewed successfully"));
});
