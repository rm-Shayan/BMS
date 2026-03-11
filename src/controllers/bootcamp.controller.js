import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Bootcamp } from "../models/bootcamp.model.js";
import { User } from "../models/user.model.js";
import { Domain } from "../models/domain.model.js";
import { Announcement } from "../models/Announcement.model.js";
import { Assignment } from "../models/assignment.model.js";
import { Submission } from "../models/submission.model.js";
import { DailyProgress } from "../models/dailyUpdate.model.js";
import { Session } from "../models/session.model.js";
import cache from "../config/cache.js";


// Helper function to clear cache
const clearBootcampCache = async () => {
    // Since we are using an in-memory cache, flush all entries when a bootcamp
    // changes so related cache keys (bootcamps, assignments, announcements, etc.)
    // do not return stale data.
    cache.flushAll();
};

export const createBootcamp = asyncHandler(async (req, res) => {
    const { name, description, startDate, endDate } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and Description are required");
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
        ? new Date(endDate)
        : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000); // default 3 months

    const bootcamp = await Bootcamp.create({
        name,
        description,
        startDate: start,
        endDate: end,
        createdBy: req.user._id,
    });

    await clearBootcampCache(); // Naya bootcamp banne par cache clear
    return res.status(201).json(new ApiResponse(201, bootcamp, "Bootcamp created successfully"));
});

export const getBootcamps = asyncHandler(async (req, res) => {
    // 1. Page aur limit extract karein (default: page 1, limit 10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 2. Caching key ko unique banayein (page aur limit ke saath)
    const cacheKey = `bootcamps_p${page}_l${limit}`;
    const cachedData = await cache.get(cacheKey);

    if (cachedData) {
        return res.status(200).json(new ApiResponse(200, JSON.parse(cachedData), "Bootcamps retrieved from cache"));
    }

    // 3. Pagination ke saath query execute karein
    // 3. Pagination ke saath query execute karein
    const bootcamps = await Bootcamp.find()
        .populate({
            path: "mentors",
            select: "name email domain", // Mentor ka name, email aur domain ID uthao
            populate: {
                path: "domain", // User model mein jo 'domain' key hai usko populate karo
                model: "Domain", // Domain model ka reference
                select: "name description" // Domain ka sirf name aur description uthao
            }
        })
        .populate({
            path: "domains",
            select: "name description"
        })
        .skip(skip)
        .limit(limit)
        .exec();

    // Optional: Total count nikalna agar frontend ko dikhana ho
    const totalBootcamps = await Bootcamp.countDocuments();

    const result = {
        bootcamps,
        pagination: {
            currentPage: page,
            limit: limit,
            totalItems: totalBootcamps,
            totalPages: Math.ceil(totalBootcamps / limit)
        }
    };

    // 4. Cache result
    await cache.set(cacheKey, JSON.stringify(result), "EX", 3600);

    return res.status(200).json(new ApiResponse(200, result, "Bootcamps retrieved successfully"));
});

export const updateBootcamp = asyncHandler(async (req, res) => {
    const { name, description, startDate, endDate, status } = req.body;
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) throw new ApiError(404, "Bootcamp not found");

    if (bootcamp.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You are not authorized");
    }

    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (description) updatedFields.description = description;

    // Start/End logic: if startDate is set, default endDate 3 months after it (unless explicit endDate provided)
    if (startDate) {
        const start = new Date(startDate);
        updatedFields.startDate = start;
        updatedFields.endDate = endDate
            ? new Date(endDate)
            : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
    } else if (endDate) {
        updatedFields.endDate = new Date(endDate);
    }

    if (status) updatedFields.status = status;

    const updatedBootcamp = await Bootcamp.findByIdAndUpdate(
        req.params.id,
        updatedFields,
        { new: true }
    );

    await clearBootcampCache(); // Update hone par cache clear
    return res.status(200).json(new ApiResponse(200, updatedBootcamp, "Bootcamp updated successfully"));
});

export const deleteBootcamp = asyncHandler(async (req, res) => {
    const bootcampId = req.params.id;

    // 1. Bootcamp dhundein
    const bootcamp = await Bootcamp.findById(bootcampId);
    if (!bootcamp) throw new ApiError(404, "Bootcamp not found");

    // 2. Authorization
    if (bootcamp.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You are not authorized");
    }

    // 

    // 3. Delete related data for this bootcamp (cascade delete)
    // Note: We're intentionally removing bootcamp-specific users (students/mentors)
    // and all related records so stale references can't remain.

    // a) Announcements for this bootcamp
    await Announcement.deleteMany({ bootcampId });

    // b) Assignments & their submissions
    const assignments = await Assignment.find({ bootcampId }, { _id: 1 }).lean();
    const assignmentIds = assignments.map((a) => a._id);

    if (assignmentIds.length) {
        await Submission.deleteMany({ assignmentId: { $in: assignmentIds } });
    }

    await Assignment.deleteMany({ bootcampId });

    // c) Domains for this bootcamp
    await Domain.deleteMany({ bootcampId });

    // d) Users (students / mentors) who were part of this bootcamp
    const usersToDelete = await User.find(
        { bootcampId, role: { $in: ["student", "mentor"] } },
        { _id: 1 }
    ).lean();

    const userIdsToDelete = usersToDelete.map((u) => u._id);

    if (userIdsToDelete.length) {
        // Clean up related user data
        await DailyProgress.deleteMany({ studentId: { $in: userIdsToDelete } });
        await Session.deleteMany({ user: { $in: userIdsToDelete } });
        await User.deleteMany({ _id: { $in: userIdsToDelete } });
    }

    // 4. Finally delete the bootcamp itself
    await Bootcamp.findByIdAndDelete(bootcampId);

    await clearBootcampCache();

    return res.status(200).json(new ApiResponse(200, null, "Bootcamp and all associated data deleted successfully"));
});
export const getBootcampById = asyncHandler(async (req, res) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
        .populate("mentors", "name email")
        .populate("domains", "name description");

    if (!bootcamp) throw new ApiError(404, "Bootcamp not found");
    return res.status(200).json(new ApiResponse(200, bootcamp, "Bootcamp retrieved successfully"));
});

export const extendBootcamp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newEndDate } = req.body;

    if (!newEndDate) throw new ApiError(400, "New end date is required");

    const bootcamp = await Bootcamp.findById(id);
    if (!bootcamp) throw new ApiError(404, "Bootcamp not found");

    bootcamp.endDate = new Date(newEndDate);
    await bootcamp.save();

    await clearBootcampCache();
    return res.status(200).json(new ApiResponse(200, bootcamp, "Bootcamp extended successfully"));
});