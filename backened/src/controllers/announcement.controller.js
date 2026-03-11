import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Announcement } from "../models/Announcement.model.js";
import cache from "../config/cache.js";


export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, targetDomain } = req.body;
  const { bootcampId } = req.params;

  const announcement = await Announcement.create({
    title,
    description,
    targetDomain: targetDomain || null,
    bootcampId: bootcampId || null,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, announcement, "Announcement created successfully"));
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  const { bootcampId } = req.params;
  const { domainId, global } = req.query;

  const filter = {};
  if (global === "true") {
    filter.bootcampId = null;
  } else if (bootcampId) {
    filter.bootcampId = bootcampId;
  }

  if (domainId) filter.targetDomain = domainId;

  const announcements = await Announcement.find(filter)
    .populate("createdBy", "name email")
    .populate("targetDomain", "name");

  return res
    .status(200)
    .json(new ApiResponse(200, announcements, "Announcements retrieved successfully"));
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const { bootcampId, id } = req.params;
  const updateData = req.body;

  const announcement = await Announcement.findOneAndUpdate(
    { _id: id, bootcampId },
    updateData,
    { new: true },
  );

  if (!announcement) throw new ApiError(404, "Announcement not found");

  return res
    .status(200)
    .json(new ApiResponse(200, announcement, "Announcement updated successfully"));
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { bootcampId, id } = req.params;

  const announcement = await Announcement.findOneAndDelete({ _id: id, bootcampId });
  if (!announcement) throw new ApiError(404, "Announcement not found");

  // Clear related cache so stale announcements don't persist
  cache.flushAll();

  return res.status(200).json(new ApiResponse(200, null, "Announcement deleted successfully"));
});
