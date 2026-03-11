import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';
const adminCreds = { email: "admin@bootcamp.com", password: "Admin123!" };
const mentorCreds = { email: "mentor_for_student_test@test.com", password: "Password123!", role: "mentor", name: "QA Mentor" };
const studentCreds = { email: "student_qa_test@test.com", password: "Password123!", role: "student", name: "QA Student" };
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runComprehensiveStudentTest() {
    console.log("🚀 Starting COMPREHENSIVE STUDENT API TEST (with Setup)...");
    let adminToken, studentToken;
    let adminAuth, studentAuth;
    let bootcampId, domainId, assignmentId, mentorId;

    try {
        // --- 1. SETUP DATA (Admin) ---
        console.log("\n--- [0] SETUP TEST DATA (Admin) ---");
        const adminLogin = await axios.post(`${BASE_URL}/auth/admin/login`, adminCreds);
        adminToken = adminLogin.data.data.accessToken;
        adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };
        console.log("✅ Admin Logged in for Setup");

        const bcRes = await axios.post(`${BASE_URL}/admin/bootcamps/bootcamp/create`, {
            name: "Student Testing Bootcamp",
            description: "Dedicated bootcamp for student testing",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, adminAuth);
        bootcampId = bcRes.data.data._id;
        console.log("✅ Test Bootcamp Created:", bootcampId);

        // Create Mentor first
        try {
            const mRes = await axios.post(`${BASE_URL}/admin/create-mentor`, {
                ...mentorCreds,
                bootcampId
            }, adminAuth);
            mentorId = mRes.data.data._id;
            console.log("✅ Test Mentor Created:", mentorId);
        } catch (e) {
            console.log("ℹ️ Mentor might already exist:", e.response?.data?.message || e.message);
        }

        const domainRes = await axios.post(`${BASE_URL}/admin/bootcamp/domains/${bootcampId}/create-domain`, {
            name: "Student QA Domain",
            description: "Domain for student testing",
            mentorId: mentorId || "64b123456789012345678901"
        }, adminAuth);
        domainId = domainRes.data.data._id;
        console.log("✅ Test Domain Created:", domainId);

        const asgnRes = await axios.post(`${BASE_URL}/admin/bootcamp/assignments/${bootcampId}/addd`, {
            title: "Student QA Assignment",
            description: "Assignment for student testing",
            domain: domainId,
            deadline: new Date(Date.now() + 86400000).toISOString()
        }, adminAuth);
        assignmentId = asgnRes.data.data._id;
        console.log("✅ Test Assignment Created:", assignmentId);

        // Create Student assigned to this bootcamp/domain
        try {
            await axios.post(`${BASE_URL}/admin/create-student`, {
                ...studentCreds,
                bootcampId,
                domain: domainId
            }, adminAuth);
            console.log("✅ Test Student Created");
        } catch (e) {
            console.log("ℹ️ Student might already exist:", e.response?.data?.message || e.message);
        }

        // --- 2. AUTHENTICATION (Student) ---
        console.log("\n--- [1] AUTHENTICATION (Student) ---");
        let loginRes;
        try {
            loginRes = await axios.post(`${BASE_URL}/auth/student/login`, studentCreds);
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.data?.firstLogin) {
                const skipRes = await axios.post(`${BASE_URL}/auth/student/skip-first-login`, { userId: err.response.data.data.userId });
                loginRes = skipRes;
            } else {
                throw err;
            }
        }
        studentToken = loginRes.data.data.accessToken;
        studentAuth = { headers: { Authorization: `Bearer ${studentToken}` } };
        console.log("✅ Student Login Successful");

        // --- 3. DASHBOARD VERIFICATION ---
        console.log("\n--- [2] DASHBOARD VERIFICATION ---");
        await axios.get(`${BASE_URL}/student/bootcamp/dashboard/`, studentAuth);
        console.log("✅ Dashboard Stats retrieved");

        await axios.get(`${BASE_URL}/student/bootcamp/dashboard/announcements`, studentAuth);
        console.log("✅ Announcements retrieved");

        const asgnsRes = await axios.get(`${BASE_URL}/student/bootcamp/dashboard/assignments`, studentAuth);
        console.log("✅ Assignments list retrieved. Count:", asgnsRes.data.data?.length);

        await axios.get(`${BASE_URL}/student/bootcamp/dashboard/assignments/${assignmentId}`, studentAuth);
        console.log("✅ Specific assignment retrieved by ID");

        // --- 4. DAILY PROGRESS ---
        console.log("\n--- [3] DAILY PROGRESS ---");
        const progRes = await axios.post(`${BASE_URL}/student/bootcamp/daily-progress/add`, {
            date: new Date().toISOString(),
            yesterdayWork: "Completed Mentor role-based tests",
            todayPlan: "Implement and verify Student role-based tests",
            hoursWorked: 4,
            blockers: "None",
            githubLink: "https://github.com/test/repo"
        }, studentAuth);
        const progressId = progRes.data.data._id;
        console.log("✅ Daily Progress Added. ID:", progressId);

        await axios.get(`${BASE_URL}/student/bootcamp/daily-progress/`, studentAuth);
        console.log("✅ My progress list retrieved");

        await axios.put(`${BASE_URL}/student/bootcamp/daily-progress/update/${progressId}`, {
            todayPlan: "Updated Student QA plan"
        }, studentAuth);
        console.log("✅ Progress Updated");

        // --- 5. SUBMISSIONS ---
        console.log("\n--- [4] SUBMISSIONS ---");
        await axios.post(`${BASE_URL}/student/bootcamp/submissions/submit`, {
            assignmentId: assignmentId,
            submissionLink: "https://github.com/test/repo",
            notes: "Please review my assignment"
        }, studentAuth);
        console.log("✅ Assignment Submitted");

        await axios.get(`${BASE_URL}/student/bootcamp/submissions/my-submissions`, studentAuth);
        console.log("✅ My Submissions retrieved");

        // --- 6. USER PROFILE ---
        console.log("\n--- [5] USER PROFILE ---");
        const meRes = await axios.get(`${BASE_URL}/student/me`, studentAuth);
        console.log("✅ Profile 'me' retrieved:", meRes.data.data.name);

        await axios.put(`${BASE_URL}/student/update`, { name: "QA Student Updated" }, studentAuth);
        console.log("✅ Profile updated");

        // --- CLEANUP ---
        console.log("\n--- [CLEANUP] (Admin) ---");
        await axios.delete(`${BASE_URL}/admin/bootcamps/bootcamp/${bootcampId}/delete`, adminAuth);
        console.log("✅ Test Bootcamp and cascade data deleted");

        console.log("\n✨ COMPREHENSIVE STUDENT API TEST PASSED SUCCESSFULLY!");

    } catch (error) {
        console.error("\n❌ TEST FAILED at step:", error.config?.url);
        console.error("Response:", error.response?.data || error.message);
        process.exit(1);
    }
}

runComprehensiveStudentTest();
