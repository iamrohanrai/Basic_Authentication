import User from "../modal/user.modal.js";
import crypto from "crypto";
import sendMail from "../utils/sendmail.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerUser = async function (req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: `All Fields are Required` });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //regex is built in js
  if (!emailRegex.test(email)) {
    // .test is regex method it give true or false
    return res.status(400).json({ error: "Invalid email format" });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
  // Explanation:
  // (?=.*[A-Z]) → at least 1 uppercase
  // (?=.*\d)   → at least 1 number
  // .{6,}      → minimum 6 characters
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 6 characters, contain 1 uppercase letter and 1 number",
    });
  }

  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ error: "User Already exist Please Login" });
    }

    const user = await User.create({ name, email, password });
    // console.log(user);

    if (!user) {
      return res.status(400).json({ error: "User Not Registered" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    // console.log(token);

    user.verificationToken = token;
    await user.save();

    // send email
    try {
      await sendMail({
        to: user.email,
        subject: "Hello Verify Your Email ✔",
        text: `Please Click On the Following Link:
          ${process.env.BASEURL}/api/v1/users/verify/${token}`,
        html: `<p>Please verify your email by clicking the link below:</p>
           <a href="${process.env.BASEURL}/api/v1/users/verify/${token}">
             Verify Email
           </a>`,
      });
    } catch (mailerror) {
      // if mail sending failed then user rollback
      //   await User.findByIdAndDelete(user._id);
      return res
        .status(500)
        .json({ error: "Failed to send verification email" });
    }

    return res.status(200).json({
      success:
        "User Registered Successfully, Check Your Email For Verification",
    });
  } catch (error) {
    console.error(`Something went Wrong' Not Able To Register User`, error);
  }
};

const verifyUser = async function (req, res) {
  const { token } = req.params;
  console.log(token);

  if (!token) {
    return res.status(400).json({ error: "Invalid Token" });
  }
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    return res.status(404).json({ error: "Invalid Token" });
  }
  user.isVerified = true;

  user.verificationToken = undefined;

  await user.save();

  return res.send("User Verified Successfully");
};

const loginUser = async function (req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ error: "Please verify your email before login" });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    console.log(isPasswordMatched);
    if (!isPasswordMatched) {
      return res.status(401).json({ error: "Invalid Email Or Password" });
    }

    const sessionToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    console.log(sessionToken);

    const cookieOption = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 24h
    };

    res.cookie("token", sessionToken, cookieOption);

    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: { id: user._id, name: user.name },
    });
  } catch (error) {
    console.log(error, `Something went wrong while login`);
  }
};

export { registerUser, verifyUser, loginUser };
