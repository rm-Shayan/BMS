import { ApiError } from "./ApiError.js";
export const generateTokens = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    // 🚩 Yeh line aapko batayegi ke asal masla kya hai (e.g. "jwt is not defined")
    console.error("TOKEN_GEN_ERROR:", error); 
    throw new ApiError(500, error?.message || "Failed to generate tokens");
  }
};