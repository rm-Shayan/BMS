import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Assignment } from "../models/assignment.model.js";
import { Submission } from "../models/submission.model.js";
import cache from "../config/cache.js";
import { uploadToCloudinary } from "../services/cloudinary.js";


export const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, domain, deadline } = req.body;
  const bootcampId = req.body.bootcampId || req.params.bootcampId;

  const attachments = [];

  if (req.files?.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, "assignments");
      attachments.push({
        url: result.secure_url,
        publicId: result.public_id
      });
    }
  }

  if (!title || !description || !domain || !deadline || !bootcampId) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const assignment = await Assignment.create({
    title,
    description,
    domain,
    deadline,
    attachments,
    bootcampId,
    createdBy: req.user._id
  });

  // cache clear
  cache.del(`assignments_${bootcampId}`);

  return res
    .status(201)
    .json(new ApiResponse(201, assignment, "Assignment created successfully"));
});


// 2️⃣ Get All Assignments (Pagination + Cache)
export const getAssignments = asyncHandler(async (req, res) => {

  const bootcampId = req.query.bootcampId || req.params.bootcampId || req.user.bootcampId;

  if (!bootcampId) {
    throw new ApiError(400, "bootcampId is required");
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  const cacheKey = `assignments_${bootcampId}_${page}_${limit}`;

  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res
      .status(200)
      .json(new ApiResponse(200, cachedData, "Assignments fetched (cache)"));
  }

  const assignments = await Assignment.find({ bootcampId })
    .populate("domain", "name")
    .populate("createdBy", "username")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Assignment.countDocuments({ bootcampId });

  const response = {
    assignments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };

  cache.set(cacheKey, response);

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Assignments fetched"));
});


// 3️⃣ Get Single Assignment (Cache)
export const getAssignmentById = asyncHandler(async (req, res) => {

  const { assignmentId } = req.params;

  const cacheKey = `assignment_${assignmentId}`;

  const cached = cache.get(cacheKey);

  if (cached) {
    return res
      .status(200)
      .json(new ApiResponse(200, cached, "Assignment fetched (cache)"));
  }

  const assignment = await Assignment.findById(assignmentId)
    .populate("domain", "name")
    .populate("createdBy", "username");

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  cache.set(cacheKey, assignment);

  return res
    .status(200)
    .json(new ApiResponse(200, assignment, "Assignment details"));
});


// 4️⃣ Update Assignment
export const updateAssignment = asyncHandler(async (req, res) => {

  const { assignmentId } = req.params;

  const assignment = await Assignment.findByIdAndUpdate(
    assignmentId,
    req.body,
    { new: true }
  );

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  // clear cache
  cache.del(`assignment_${assignmentId}`);

  return res
    .status(200)
    .json(new ApiResponse(200, assignment, "Updated successfully"));
});


// 5️⃣ Delete Assignment
export const deleteAssignment = asyncHandler(async (req, res) => {

  const { assignmentId } = req.params;

  // 1) Remove any submissions linked to this assignment (clear foreign-key relations)
  await Submission.deleteMany({ assignmentId });

  // 2) Remove the assignment itself
  await Assignment.findByIdAndDelete(assignmentId);

  // 3) Invalidate cache
  cache.del(`assignment_${assignmentId}`);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Assignment and related submissions deleted successfully"));
});