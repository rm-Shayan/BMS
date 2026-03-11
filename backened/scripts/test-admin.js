import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';
const adminCredentials = { email: "admin@bootcamp.com", password: "Admin123!" };

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runComprehensiveAdminTest() {
    console.log("🚀 Starting COMPREHENSIVE ADMIN API TEST...");
    let token;
    let authHeader;

    try {
        // --- 1. LOGIN ---
        console.log("\n--- [1] AUTHENTICATION ---");
        const loginRes = await axios.post(`${BASE_URL}/auth/admin/login`, adminCredentials);
        token = loginRes.data.data.accessToken;
        authHeader = { headers: { Authorization: `Bearer ${token}` } };
        console.log("✅ Admin Login Successful");

        // --- 2. BOOTCAMP CRUD ---
        console.log("\n--- [2] BOOTCAMP MANAGEMENT ---");
        const createBC = await axios.post(`${BASE_URL}/admin/bootcamps/bootcamp/create`, {
            name: "QA Automation Bootcamp",
            description: "A temporary bootcamp for API testing",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, authHeader);
        const bcId = createBC.data.data._id;
        console.log("✅ Bootcamp Created. ID:", bcId);

        await axios.put(`${BASE_URL}/admin/bootcamps/bootcamp/${bcId}/update`, {
            description: "Updated description for QA"
        }, authHeader);
        console.log("✅ Bootcamp Updated");

        await axios.patch(`${BASE_URL}/admin/bootcamps/bootcamp/${bcId}/extend`, {
            newEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        }, authHeader);
        console.log("✅ Bootcamp Extended");

        // --- 3. DOMAIN MANAGEMENT ---
        console.log("\n--- [3] DOMAIN MANAGEMENT ---");
        // We need a mentor ID to create a domain. Let's find existing mentor or use a dummy if we can't create one yet.
        // Actually, let's create a mentor first to link to the domain.

        console.log("\n--- [4] USER MANAGEMENT (Mentor/Student) ---");
        const testMentorEmail = `mentor_qa_${Date.now()}@test.com`;
        const createMentor = await axios.post(`${BASE_URL}/admin/create-mentor`, {
            name: "QA Mentor",
            email: testMentorEmail,
            password: "Password123!",
            role: "mentor",
            bootcampId: bcId
        }, authHeader);
        const mentorId = createMentor.data.data._id;
        console.log("✅ Mentor Created. ID:", mentorId);

        // Now create Domain with this mentor
        const createDomain = await axios.post(`${BASE_URL}/admin/bootcamp/domains/${bcId}/create-domain`, {
            name: "API Engineering",
            description: "Testing domain creation",
            mentorId: mentorId
        }, authHeader);
        const domainId = createDomain.data.data._id;
        console.log("✅ Domain Created. ID:", domainId);

        const testStudentEmail = `student_qa_${Date.now()}@test.com`;
        const createStudent = await axios.post(`${BASE_URL}/admin/create-student`, {
            name: "QA Student",
            email: testStudentEmail,
            password: "Password123!",
            role: "student",
            bootcampId: bcId,
            domain: domainId
        }, authHeader);
        const studentId = createStudent.data.data._id;
        console.log("✅ Student Created. ID:", studentId);

        // Update status / Block
        await axios.put(`${BASE_URL}/admin/status/${studentId}`, { status: false }, authHeader);
        console.log("✅ Student Deactivated");

        await axios.patch(`${BASE_URL}/admin/block/${studentId}`, {}, authHeader);
        console.log("✅ Student Blocked");

        // --- 5. ANNOUNCEMENT MANAGEMENT ---
        console.log("\n--- [5] ANNOUNCEMENT MANAGEMENT ---");
        const globalAnn = await axios.post(`${BASE_URL}/admin/bootcamp/announcements/create-global`, {
            title: "Global QA System Alert",
            description: "This is a system-wide test announcement"
        }, authHeader);
        const gAnnId = globalAnn.data.data._id;
        console.log("✅ Global Announcement Created");

        const bcAnn = await axios.post(`${BASE_URL}/admin/bootcamp/announcements/${bcId}/create`, {
            title: "Internal BC Alert",
            description: "Specific to QA Bootcamp"
        }, authHeader);
        const bcAnnId = bcAnn.data.data._id;
        console.log("✅ Bootcamp Announcement Created");

        // Update announcement
        await axios.put(`${BASE_URL}/admin/bootcamp/announcements/${bcId}/update/${bcAnnId}`, {
            title: "Internal BC Alert (Updated)"
        }, authHeader);
        console.log("✅ Announcement Updated");

        // --- 6. DASHBOARD VERIFICATION ---
        console.log("\n--- [6] DASHBOARD VERIFICATION ---");
        const dashboard = await axios.get(`${BASE_URL}/admin/bootcamp/dashboard/`, authHeader);
        console.log("✅ Admin Dashboard Stats retrieved");

        // --- 7. CLEANUP (Testing Deletions) ---
        console.log("\n--- [7] CLEANUP & DELETION TESTS ---");

        await axios.delete(`${BASE_URL}/admin/bootcamp/announcements/${bcId}/delete/${bcAnnId}`, authHeader);
        console.log("✅ Bootcamp Announcement Deleted");

        await axios.delete(`${BASE_URL}/admin/bootcamps/bootcamp/domain/delete/${domainId}`, authHeader);
        console.log("✅ Domain Deleted");

        await axios.delete(`${BASE_URL}/admin/delete/${studentId}`, authHeader);
        console.log("✅ Student Deleted");
        await delay(500);

        await axios.delete(`${BASE_URL}/admin/delete/${mentorId}`, authHeader);
        console.log("✅ Mentor Deleted");
        await delay(500);

        await axios.delete(`${BASE_URL}/admin/bootcamps/bootcamp/${bcId}/delete`, authHeader);
        console.log("✅ Bootcamp Deleted (Cascade test complete)");

        console.log("\n✨ COMPREHENSIVE ADMIN API TEST PASSED SUCCESSFULLY!");

    } catch (error) {
        console.error("\n❌ TEST FAILED at step:", error.config?.url);
        console.error("Response:", error.response?.data || error.message);
    }
}

runComprehensiveAdminTest();
