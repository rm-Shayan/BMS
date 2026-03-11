import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';
const adminCreds = { email: "admin@bootcamp.com", password: "Admin123!" };
const mentorCreds = { email: "mentor_qa_test@test.com", password: "Password123!", role: "mentor", name: "QA Mentor" };
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runComprehensiveMentorTest() {
    console.log("🚀 Starting COMPREHENSIVE MENTOR API TEST (with Setup)...");
    let adminToken;
    let mentorToken;
    let adminAuth;
    let mentorAuth;
    let bootcampId;
    let domainId;

    try {
        // --- 1. SETUP DATA (Admin) ---
        console.log("\n--- [0] SETUP TEST DATA (Admin) ---");
        const adminLogin = await axios.post(`${BASE_URL}/auth/admin/login`, adminCreds);
        adminToken = adminLogin.data.data.accessToken;
        adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };
        console.log("✅ Admin Logged in for Setup");

        const bcRes = await axios.post(`${BASE_URL}/admin/bootcamps/bootcamp/create`, {
            name: "Mentor Testing Bootcamp",
            description: "Dedicated bootcamp for mentor testing",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, adminAuth);
        bootcampId = bcRes.data.data._id;
        console.log("✅ Test Bootcamp Created:", bootcampId);

        // Create Mentor assigned to this bootcamp
        let mentorRes;
        try {
            mentorRes = await axios.post(`${BASE_URL}/admin/create-mentor`, {
                ...mentorCreds,
                bootcampId
            }, adminAuth);
            console.log("✅ Test Mentor Created");
        } catch (e) {
            console.log("ℹ️ Mentor might already exist or error:", e.response?.data?.message || e.message);
            // If exists, we'll try to login anyway or find them
        }

        const domainRes = await axios.post(`${BASE_URL}/admin/bootcamp/domains/${bootcampId}/create-domain`, {
            name: "Mentor QA Domain",
            description: "Domain for mentor testing",
            mentorId: mentorRes?.data?.data?._id // If created now, use its ID
        }, adminAuth);
        domainId = domainRes.data.data._id;
        console.log("✅ Test Domain Created:", domainId);

        // --- 2. AUTHENTICATION (Mentor) ---
        console.log("\n--- [1] AUTHENTICATION (Mentor) ---");
        let loginRes;
        try {
            loginRes = await axios.post(`${BASE_URL}/auth/mentor/login`, mentorCreds);
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.data?.firstLogin) {
                const skipRes = await axios.post(`${BASE_URL}/auth/mentor/skip-first-login`, { userId: err.response.data.data.userId });
                loginRes = skipRes;
            } else {
                throw err;
            }
        }
        mentorToken = loginRes.data.data.accessToken;
        mentorAuth = { headers: { Authorization: `Bearer ${mentorToken}` } };
        console.log("✅ Mentor Login Successful");

        // --- 3. DASHBOARD & STUDENTS ---
        console.log("\n--- [2] DASHBOARD & STUDENTS ---");
        const dashRes = await axios.get(`${BASE_URL}/mentor/bootcamp/dashboard/`, mentorAuth);
        console.log("✅ Dashboard Stats retrieved");

        const studentsRes = await axios.get(`${BASE_URL}/mentor/bootcamp/dashboard/students`, mentorAuth);
        const studentList = studentsRes.data.data.students || [];
        console.log("✅ Students list retrieved. Count:", studentList.length);

        // --- 4. DOMAIN VERIFICATION ---
        console.log("\n--- [3] DOMAIN VERIFICATION ---");
        const domainsRes = await axios.get(`${BASE_URL}/mentor/bootcamp/domains/${bootcampId}`, mentorAuth);
        console.log("✅ Domains list retrieved. Count:", domainsRes.data.data?.length);

        // --- 5. ASSIGNMENT MANAGEMENT ---
        console.log("\n--- [4] ASSIGNMENT MANAGEMENT ---");
        const createAsgnRes = await axios.post(`${BASE_URL}/mentor/bootcamp/assignments/create-assignment`, {
            title: `Assignment for ${domainId}`,
            description: "Testing mentor assignment creation with real domain",
            domain: domainId,
            deadline: new Date(Date.now() + 86400000).toISOString(),
            bootcampId: bootcampId
        }, mentorAuth);
        const assignmentId = createAsgnRes.data.data._id;
        console.log("✅ Assignment Created. ID:", assignmentId);

        await axios.put(`${BASE_URL}/mentor/bootcamp/assignments/assignments/${assignmentId}`, {
            title: "Updated Mentor Assignment"
        }, mentorAuth);
        console.log("✅ Assignment Updated");

        // --- 6. SUBMISSIONS ---
        console.log("\n--- [5] SUBMISSIONS ---");
        const submissionsRes = await axios.get(`${BASE_URL}/mentor/bootcamp/submissions/all`, mentorAuth);
        console.log("✅ All submissions retrieved");

        // --- 7. CLEANUP (Admin) ---
        console.log("\n--- [CLEANUP] (Admin) ---");
        await axios.delete(`${BASE_URL}/admin/bootcamps/bootcamp/${bootcampId}/delete`, adminAuth);
        console.log("✅ Test Bootcamp and cascade data deleted");

        console.log("\n✨ COMPREHENSIVE MENTOR API TEST PASSED SUCCESSFULLY!");

    } catch (error) {
        console.error("\n❌ TEST FAILED at step:", error.config?.url);
        console.error("Response:", error.response?.data || error.message);
        process.exit(1);
    }
}

runComprehensiveMentorTest();
