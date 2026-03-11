import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cache from "../config/cache.js";
import { Bootcamp } from "../models/bootcamp.model.js";
import { Domain } from "../models/domain.model.js";
import { User } from "../models/user.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Announcement } from "../models/Announcement.model.js";
import { Submission } from "../models/submission.model.js";
import { DailyProgress } from "../models/dailyUpdate.model.js";

// --- Cache Helpers ---
const CACHE_TTL = 600; // 10 minutes

async function getCached(key, ttl, computeFn) {
  const cached = await cache.get(key);
  if (cached) return JSON.parse(cached);

  const value = await computeFn();
  await cache.set(key, JSON.stringify(value), ttl);
  return value;
}

// --- Admin / Global ---
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await getCached("admin:dashboard:stats", CACHE_TTL, async () => {
    const [totalBootcamps, totalDomains, totalMentors, totalStudents] = await Promise.all([
      Bootcamp.countDocuments(),
      Domain.countDocuments(),
      User.countDocuments({ role: "mentor" }),
      User.countDocuments({ role: "student" }),
    ]);

    return { totalBootcamps, totalDomains, totalMentors, totalStudents };
  });

  return res.status(200).json(new ApiResponse(200, stats, "Dashboard stats retrieved successfully"));
});

// --- Mentor ---
export const getMentorDashboardStats = asyncHandler(async (req, res) => {
  const mentorId = req.user._id;
  const stats = await getCached(`mentor:stats:${mentorId}`, CACHE_TTL, async () => {
    const totalAssignedDomains = await Domain.countDocuments({ mentorId });
    const bootcamps = await Bootcamp.find({ mentors: mentorId }).select("_id");
    const bootcampIds = bootcamps.map((b) => b._id);

    const totalStudentsInBootcamps = bootcampIds.length
      ? await User.countDocuments({ role: "student", bootcampId: { $in: bootcampIds } })
      : 0;

    const upcomingDeadlines = await Assignment.countDocuments({
      domain: { $in: await Domain.find({ mentorId }).distinct("_id") },
      deadline: { $gte: new Date() },
    });

    return {
      totalAssignedDomains,
      totalBootcamps: bootcampIds.length,
      totalStudentsInBootcamps,
      upcomingDeadlines,
    };
  });

  return res.status(200).json(new ApiResponse(200, stats, "Mentor dashboard stats retrieved successfully"));
});

export const getMentorStudents = asyncHandler(async (req, res) => {
  const mentorId = req.user._id;
  const bootcamps = await Bootcamp.find({ mentors: mentorId }).select("_id name");
  const bootcampIds = bootcamps.map((b) => b._id);

  const students = await User.find({ role: "student", bootcampId: { $in: bootcampIds } })
    .select("name email bootcampId")
    .populate("bootcampId", "name");

  const studentIds = students.map((s) => s._id);
  const submissionStats = await Submission.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    {
      $group: {
        _id: "$studentId",
        totalSubmissions: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        reviewed: { $sum: { $cond: [{ $eq: ["$status", "reviewed"] }, 1, 0] } },
        accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
      },
    },
  ]);

  const statsByStudent = submissionStats.reduce((acc, cur) => {
    acc[cur._id.toString()] = cur;
    return acc;
  }, {});

  const studentsWithStats = students.map((student) => ({
    ...student.toObject(),
    submissionStats: statsByStudent[student._id.toString()] || {
      totalSubmissions: 0,
      pending: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0,
    },
  }));

  return res.status(200).json(
    new ApiResponse(200, { bootcamps, students: studentsWithStats }, "Mentor students retrieved successfully")
  );
});

export const getMentorStudentAssignmentStats = asyncHandler(async (req, res) => {
  const mentorId = req.user._id;
  const { studentId } = req.params;

  const student = await User.findById(studentId).populate("bootcampId", "mentors name");
  if (!student || student.role !== "student") throw new ApiError(404, "Student not found");

  const bootcamp = student.bootcampId;
  if (!bootcamp || !bootcamp.mentors?.some((id) => id.toString() === mentorId.toString())) {
    throw new ApiError(403, "Not authorized to view this student");
  }

  const totalAssignments = await Assignment.countDocuments({ bootcampId: bootcamp._id });
  const submissionStats = await Submission.aggregate([
    { $match: { studentId: student._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = submissionStats.reduce(
    (acc, { _id, count }) => ({
      ...acc,
      [String(_id)]: count,
    }),
    {
      totalAssignments,
      totalSubmissions: 0,
      pending: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0,
    }
  );

  stats.totalSubmissions = submissionStats.reduce((sum, item) => sum + item.count, 0);

  return res.status(200).json(new ApiResponse(200, { student, stats }, "Student assignment stats retrieved successfully"));
});

// --- Student ---
export const getStudentDashboardStats = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const stats = await getCached(`student:stats:${studentId}`, CACHE_TTL, async () => {
    const recentProgress = await DailyProgress.find({ studentId }).sort({ date: -1 }).limit(5);
    const dailyProgressCount = await DailyProgress.countDocuments({ studentId });

    const student = await User.findById(studentId);
    const bootcampId = student?.bootcampId;

    const [upcomingAssignments, totalAssignments, totalAnnouncements] = await Promise.all([
      bootcampId
        ? Assignment.countDocuments({
            bootcampId,
            deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          })
        : 0,
      bootcampId ? Assignment.countDocuments({ bootcampId }) : 0,
      bootcampId ? Announcement.countDocuments({ bootcampId }) : 0,
    ]);

    return {
      recentProgress,
      dailyProgressCount,
      upcomingAssignments,
      totalAssignments,
      totalAnnouncements,
      bootcampId,
    };
  });

  return res.status(200).json(new ApiResponse(200, stats, "Student dashboard stats retrieved successfully"));
});

export const getStudentBootcampAnnouncements = asyncHandler(async (req, res) => {
  const bootcampId = req.user.bootcampId || req.query.bootcampId;
  if (!bootcampId) throw new ApiError(400, "Student is not assigned to a bootcamp");

  const { domainId } = req.query;
  const announcements = await getCached(
    `announcements:${bootcampId}:${domainId || "all"}`,
    CACHE_TTL,
    async () => {
      const filter = { bootcampId };
      if (domainId) filter.targetDomain = domainId;

      return Announcement.find(filter)
        .populate("createdBy", "name email")
        .populate("targetDomain", "name");
    }
  );

  return res.status(200).json(new ApiResponse(200, announcements, "Announcements retrieved successfully"));
});

export const getStudentBootcampAssignments = asyncHandler(async (req, res) => {
  const bootcampId = req.user.bootcampId || req.query.bootcampId;
  if (!bootcampId) throw new ApiError(400, "Student is not assigned to a bootcamp");

  const assignments = await getCached(
    `student:assignments:${bootcampId}`,
    CACHE_TTL,
    async () =>
      Assignment.find({ bootcampId })
        .populate("domain", "name")
        .populate("createdBy", "username"),
  );

  return res.status(200).json(new ApiResponse(200, assignments, "Assignments retrieved successfully"));
});

export const getStudentAssignmentById = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const assignment = await Assignment.findById(assignmentId)
    .populate("domain", "name")
    .populate("createdBy", "username");

  if (!assignment) throw new ApiError(404, "Assignment not found");

  return res.status(200).json(new ApiResponse(200, assignment, "Assignment details"));
});

// --- Optional / Helpers ---
export const getBootcampDashboardStats = asyncHandler(async (req, res) => {
  const bootcampId = req.params.id;
  const stats = await getCached(`bootcamp:stats:${bootcampId}`, CACHE_TTL, async () => {
    const [totalStudents, totalMentors, totalDomains, totalAssignments, submissionStats] = await Promise.all([
      User.countDocuments({ role: "student", bootcampId }),
      User.countDocuments({ role: "mentor", bootcampId }),
      Domain.countDocuments({ bootcampId }),
      Assignment.countDocuments({ bootcampId }),
      Submission.aggregate([
        { $match: { assignmentId: { $in: await Assignment.find({ bootcampId }).distinct("_id") } } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);

    const submissions = { pending: 0, reviewed: 0, accepted: 0, rejected: 0 };
    submissionStats.forEach(s => submissions[s._id] = s.count);

    return { totalStudents, totalMentors, totalDomains, totalAssignments, submissions };
  });

  return res.status(200).json(new ApiResponse(200, stats, "Bootcamp dashboard stats retrieved successfully"));
});

