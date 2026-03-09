export const sanitizeUser = (user, role = "student") => {
  if (!user) return null;

  // Mongoose documents have toObject(), but plain objects (from .lean()) do not.
  const userObj = typeof user.toObject === "function" ? user.toObject() : { ...user };

  const { password, ...sanitizedUser } = userObj;

  if (sanitizedUser.avatar) {
    delete sanitizedUser.avatar.public_id;
  }

  if (role !== "admin") {
    delete sanitizedUser.dropOut;
    delete sanitizedUser.isActive;
  }

  return sanitizedUser;
};