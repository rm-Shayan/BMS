import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./src/models/user.model.js";
import { Bootcamp } from "./src/models/bootcamp.model.js";
import { Domain } from "./src/models/domain.model.js";

dotenv.config({ path: "./.env" });

const MONGO_URI = process.env.MONGO_URI;

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
      domain: "Management",
    });
  }

  // 2. Create Mentor (Pehle Mentor banayenge taake Domain ko mentorId mil sake)
  const mentorEmail = "mentor@bootcamp.com";
  let mentor = await User.findOne({ email: mentorEmail });
  if (!mentor) {
    mentor = await User.create({
      name: "Mentor One",
      email: mentorEmail,
      password: "Mentor123!",
      role: "mentor",
      domain: "Web Development",
    });
  }

  // 3. Create Bootcamp
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
      mentors: [mentor._id] // Mentor link kar diya
    });
  }

  // 4. Create Domain (Ab mentorId available hai)
  const domainName = "Web Development";
  let domain = await Domain.findOne({ name: domainName, bootcampId: bootcamp._id });
  if (!domain) {
    domain = await Domain.create({
      name: domainName,
      description: "Frontend and Backend development",
      bootcampId: bootcamp._id,
      mentorId: mentor._id // REQUIRED FIELD FIX
    });
  }

  // 5. Update Mentor & Intern with Bootcamp Reference
  mentor.bootcampId = bootcamp._id;
  await mentor.save();

  const internEmail = "intern@bootcamp.com";
  let intern = await User.findOne({ email: internEmail });
  if (!intern) {
    await User.create({
      name: "Intern One",
      email: internEmail,
      password: "Intern123!",
      role: "student",
      domain: domainName,
      bootcampId: bootcamp._id
    });
  }

  console.log("✅ Seed completed successfully!");
}

seed();