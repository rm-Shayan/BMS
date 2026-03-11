import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Domain } from "../models/domain.model.js";
import { Bootcamp } from "../models/bootcamp.model.js";
import { User } from "../models/user.model.js";

export const createDomain = asyncHandler(async (req, res) => {
    const { name, description, mentorId } = req.body;
    // URL params se ya body se bootcampId lein
    const bootcampId = req.body.bootcampId || req.params.bootcampId || req.params.id;

    if (!name || !description || !bootcampId || !mentorId) {
        throw new ApiError(400, "All fields (name, description, bootcampId, mentorId) are required");
    }

    // 1. Domain Create
    const domain = await Domain.create({
        name,
        description,
        bootcampId,
        mentorId,
    });

    // 2. Bootcamp mein Domain ID push karein
    await Bootcamp.findByIdAndUpdate(bootcampId, {
        $addToSet: { domains: domain._id }
    });

    // 3. Mentor (User) ke model mein Domain ID update karein
    // Hum findByIdAndUpdate use kar rahe hain taaki agar mentor pehle se domain rakhta ho toh update ho jaye
    await User.findByIdAndUpdate(mentorId, {
        domain: domain._id 
    });

    return res.status(201).json(
        new ApiResponse(201, domain, "Domain created and linked to Bootcamp and Mentor successfully")
    );
});

export const getDomains = asyncHandler(async (req, res) => {
    // Optionally filter by bootcampId if provided via params
    const filter = {};
    if (req.params.bootcampId) {
        filter.bootcampId = req.params.bootcampId;
    }

    // Populate zaroori hai taake data dikhe
    const domains = await Domain.find(filter)
        .populate("mentorId", "name email")
        .populate("bootcampId", "name");

    return res.status(200).json(new ApiResponse(200, domains, "Domains retrieved successfully"));
});

export const updateDomain = asyncHandler(async (req, res) => {
    const domainId = req.params.id;
    const { name, description, mentorId, bootcampId } = req.body;

    // 1. Purana Domain fetch karein
    const oldDomain = await Domain.findById(domainId);
    if (!oldDomain) throw new ApiError(404, "Domain not found");

    // 2. Domain Update
    const updateData = { name, description, mentorId, bootcampId };
    const updatedDomain = await Domain.findByIdAndUpdate(
        domainId,
        updateData,
        { new: true }
    );

    // 3. Mentor Sync Logic (Sirf agar mentor badla hai)
    if (mentorId && mentorId !== oldDomain.mentorId?.toString()) {
        // Purane Mentor se link remove
        if (oldDomain.mentorId) {
            await User.findByIdAndUpdate(oldDomain.mentorId, { $set: { domain: null } });
        }
        // Naye Mentor ko link assign
        await User.findByIdAndUpdate(mentorId, { $set: { domain: domainId } });
    }

    // 4. Bootcamp Sync Logic (Agar bootcamp change hua hai)
    if (bootcampId && bootcampId !== oldDomain.bootcampId?.toString()) {
        // Purane Bootcamp se ID remove karein
        await Bootcamp.findByIdAndUpdate(oldDomain.bootcampId, {
            $pull: { domains: domainId }
        });
        // Naye Bootcamp mein ID add karein
        await Bootcamp.findByIdAndUpdate(bootcampId, {
            $addToSet: { domains: domainId }
        });
    }

    return res.status(200).json(new ApiResponse(200, updatedDomain, "Domain updated and all references synced"));
});

export const deleteDomain = asyncHandler(async (req, res) => {
    const { id } = req.params; // Domain ID

    // 1. Domain dhundein
    const domain = await Domain.findById(id);
    if (!domain) throw new ApiError(404, "Domain not found");

    // 2. Bootcamp se domain ID remove karein
    await Bootcamp.findByIdAndUpdate(domain.bootcampId, {
        $pull: { domains: domain._id }
    });

    // 3. Mentor aur saare Students se domain link saaf karein
    // Jo bhi users is domain ke saath linked thay, unka domain field null kar dein
    await User.updateMany(
        { domain: id }, 
        { $set: { domain: null } }
    );

    // 4. Domain delete karein
    await Domain.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, null, "Domain deleted and all student/mentor references cleared")
    );
});