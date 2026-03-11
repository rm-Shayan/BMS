import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // Yeh line sabse upar honi chahiye logic se pehle

import mongoose from "mongoose";
import { connectMongoDB } from "./src/config/db.js";
import { User } from "./src/models/user.model.js";
import { Bootcamp } from "./src/models/bootcamp.model.js";
import { Domain } from "./src/models/domain.model.js";


console.log("🔌 Connecting to MongoDB...",process.env.MONGO_URI);

async function seed() {
  console.log("🌱 Seeding started...");

  // 1. Create Admin
  const adminEmail = "admin@bootcamp.com";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Bootcamp Admin",
      email: adminEmail,
      password: "Admin123!",
      role: "admin",
      // Admin ke liye domain optional rakhein ya koi default ID den
      domain: new mongoose.Types.ObjectId(), 
    });
  }

  // 2. Create Bootcamp (Pehle bootcamp taake domain link ho sake)
  const bootcampName = "Full Stack Bootcamp";
  let bootcamp = await Bootcamp.findOne({ name: bootcampName });
  if (!bootcamp) {
    bootcamp = await Bootcamp.create({
      name: bootcampName,
      description: "MERN Stack specialized bootcamp",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: "active",
      createdBy: admin._id,
    });
  }

  // 3. Create Mentor
  const mentorEmail = "mentor@bootcamp.com";
  let mentor = await User.findOne({ email: mentorEmail });
  if (!mentor) {
    mentor = await User.create({
      name: "Mentor One",
      email: mentorEmail,
      password: "Mentor123!",
      role: "mentor",
      bootcampId: bootcamp._id,
      // Filhal dummy ID, niche update karenge domain banne ke baad
      domain: new mongoose.Types.ObjectId(), 
    });
  }

  // 4. Create Domain (Asli Mentor aur Bootcamp ID ke saath)
  const domainName = "Web Development";
  let domain = await Domain.findOne({ name: domainName, bootcampId: bootcamp._id });
  if (!domain) {
    domain = await Domain.create({
      name: domainName,
      description: "Frontend and Backend development",
      bootcampId: bootcamp._id,
      mentorId: mentor._id
    });
  }

  // 5. Update Mentor with actual Domain ID
  mentor.domain = domain._id;
  await mentor.save();

  // 6. Link Mentor to Bootcamp array
 let isUpdated = false;

// Mentor check
if (!bootcamp.mentors.includes(mentor._id)) {
    bootcamp.mentors.push(mentor._id);
    isUpdated = true;
}

// Domain check (Yeh alag se check hona chahiye)
if (!bootcamp.domains.includes(domain._id)) {
    bootcamp.domains.push(domain._id);
    isUpdated = true;
}

if (isUpdated) {
    await bootcamp.save();
    console.log("🔗 Bootcamp links updated (Mentors/Domains)");
}

  // 7. Create Intern (Student)
  const internEmail = "intern@bootcamp.com";
  let intern = await User.findOne({ email: internEmail });
  if (!intern) {
    await User.create({
      name: "Intern One",
      email: internEmail,
      password: "Intern123!",
      role: "student",
      domain: domain._id, // String nahi, Domain ki ID deni hai
      bootcampId: bootcamp._id
    });
  }

  console.log("✅ Seed completed successfully!");
}

export async function connectAndSeed() {
  try {
    await connectMongoDB();
    await seed();
  } finally {
    await mongoose.disconnect();
  }
}

// Run directly with `node seed.js`
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  connectAndSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
