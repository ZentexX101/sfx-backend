const bcrypt = require("bcryptjs");
const Auth = require("./auth.model");
const AppError = require("../../errors/AppError");
const { generateToken } = require("../../utils/tokenUtils");
const config = require("../../config/config");

const registerUser = async (payload) => {
  const { name, email, password } = payload;

  const existingUser = await Auth.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError(409, "User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const role =
    config.admin_email &&
    config.admin_email.toLowerCase() === email.toLowerCase()
      ? "admin"
      : "user";

  const user = await Auth.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
  });

  const token = generateToken(user._id, user.role);
  const userObject = user.toObject();
  delete userObject.password;

  return {
    user: userObject,
    token,
  };
};

const loginUser = async (payload) => {
  const { email, password } = payload;

  const user = await Auth.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = generateToken(user._id, user.role);
  const userObject = user.toObject();
  delete userObject.password;

  return {
    user: userObject,
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
};
