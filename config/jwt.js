import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "7d";

export const generateToken = (userId, userName) => {
  return jwt.sign(
    {
      id: userId,
      name: userName,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};
