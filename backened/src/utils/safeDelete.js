import fs from "fs";
import path from "path";
import os from "os";

export const safeDeleteFile = async (filePath) => {
  try {
    if (!filePath) return;


    const normalizedPath = path.isAbsolute(filePath)
      ? path.normalize(filePath)
      : path.normalize(path.join(process.cwd(), filePath));

    // Prevent path traversal
    const projectRoot = process.cwd();
    const systemTempDir = os.tmpdir();

    const isInProject = normalizedPath.startsWith(projectRoot);
    const isInTemp = normalizedPath.startsWith(systemTempDir);

    if (!isInProject && !isInTemp) {
      console.warn("⚠️ Attempt to delete file outside allowed paths:", normalizedPath);
      return;
    }

    if (fs.existsSync(normalizedPath)) {
      await new Promise((res) => setTimeout(res, 150)); // prevent locked file errors
      fs.unlinkSync(normalizedPath);
      console.log("🗑️ File deleted successfully:", normalizedPath);
    } else {
      console.warn("⚠️ File not found for deletion:", normalizedPath);
    }
  } catch (err) {
    console.error("❌ Error deleting file:", err.message);
  }
};