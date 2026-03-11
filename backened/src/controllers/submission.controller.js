import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Submission } from "../models/submission.model.js";
import { Assignment } from "../models/assignment.model.js";
import cache from "../config/cache.js";

const buildSubmissionCacheKey = ({ assignmentId, studentId, status, page, limit }) => {
  const parts = [
    "submissions",
    assignmentId || "all",
    studentId || "all",
    status || "all",
    page || 1,
    limit || 10,
  ];
  return parts.join("_");
};

const clearSubmissionsCache = ({ assignmentId, studentId, status } = {}) => {
  const keys = cache.keys();

  keys.forEach((key) => {
    if (!key.startsWith("submissions_")) return;
    if (assignmentId && !key.includes(`_${assignmentId}_`)) return;
    if (studentId && !key.includes(`_${studentId}_`)) return;
    if (status && !key.includes(`_${status}_`)) return;
    cache.del(key);
  });
};


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

    // Invalidate any cached submission list that could include this one
    clearSubmissionsCache({ assignmentId, studentId });

    return res.status(201).json(new ApiResponse(201, submission, "Assignment submitted successfully"));
});

export const getSubmissions = asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { studentId, status } = req.query;

    const filter = {};
    if (assignmentId) filter.assignmentId = assignmentId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // When a mentor loads submissions, automatically mark any pending submissions as reviewed/viewed.
    // This ensures the teacher doesn't need to pass a query param to mark things as seen.
    if (req.user?.role === "mentor") {
        await Submission.updateMany(
            { ...filter, status: "pending" },
            { status: "reviewed", viewedAt: new Date(), viewedBy: req.user._id }
        );

        clearSubmissionsCache(filter);
    }

    const cacheKey = buildSubmissionCacheKey({
        ...filter,
        page,
        limit
    });

    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
        return res
            .status(200)
            .json(new ApiResponse(200, cachedResponse, "Submissions fetched (cache)"));
    }

    const [submissions, total] = await Promise.all([
        Submission.find(filter)
            .populate("studentId", "name email")
            .populate("assignmentId", "title")
            .skip(skip)
            .limit(limit)
            .sort({ submittedAt: -1 }),
        Submission.countDocuments(filter)
    ]);

    const response = {
        submissions,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };

    cache.set(cacheKey, response);

    return res.status(200).json(new ApiResponse(200, response, "Submissions retrieved successfully"));
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

    const update = { status, feedback, score };

    // Track who reviewed/accepted/rejected the submission.
    if (req.user?.role === "mentor") {
        update.viewedAt = new Date();
        update.viewedBy = req.user._id;
    }

    const submission = await Submission.findByIdAndUpdate(
        id,
        update,
        { new: true }
    );

    if (!submission) throw new ApiError(404, "Submission not found");

    // Invalidate any cached listing that could include this submission
    clearSubmissionsCache({
        assignmentId: submission.assignmentId?.toString(),
        studentId: submission.studentId?.toString(),
        status: submission.status
    });

    return res.status(200).json(new ApiResponse(200, submission, "Submission reviewed successfully"));
});
