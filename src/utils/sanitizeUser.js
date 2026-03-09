export const sanitizeUser = (user, role = "student") => {
  if (!user) return null;

  const userObj = user.toObject();

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