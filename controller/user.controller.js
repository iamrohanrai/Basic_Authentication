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

    console.log(`Password Matched: `, isPasswordMatched);
    if (!isPasswordMatched) {
      return res.status(401).json({ error: "Invalid Email Or Password" });
    }

    const sessionToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    console.log(`Session token : `, sessionToken);

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

const userProfile = async function (req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password"); // excluded password

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(`Internal Error Fetching User Profile`);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const resendVerificationMail = async function (req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User Not Registered",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User Already Verified",
      });
    }

    const verificationToken = user.verificationToken;

    // send email
    try {
      await sendMail({
        to: user.email,
        subject: "Hello Verify Your Email ✔",
        text: `Please Click On the Following Link:
          ${process.env.BASEURL}/api/v1/users/verify/${verificationToken}`,
        html: `<p>Please verify your email by clicking the link below:</p>
           <a href="${process.env.BASEURL}/api/v1/users/verify/${verificationToken}">
             Verify Email
           </a>`,
      });
    } catch (mailerror) {
      return res
        .status(500)
        .json({ error: "Failed to send verification email" });
    }

    return res.status(200).json({
      success: true,
      message: "Verification email resent successfully",
    });
  } catch (error) {
    console.error("Resend verification error ❌", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const forgotPassword = async function (req, res) {
  try {
    // get email req.body se
    // validate
    // reset password token n expiry set => Date.now() + 10 *60 * 1000
    // user.save()
    // send mail
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //regex is built in js
    if (!emailRegex.test(email)) {
      // .test is regex method it give true or false
      return res.status(400).json({ error: "Invalid email format" });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User Not Registered",
      });
    }
    const resetToken = crypto.randomBytes(25).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // send email
    try {
      await sendMail({
        to: user.email,
        subject: "Hello Reset Your Password ✔",
        text: `Please Click On the Following Link:
          ${process.env.BASEURL}/api/v1/users/reset-password/${resetToken}`,
        html: `<p>Please reset your password by clicking the link below:</p>
           <a href="${process.env.BASEURL}/api/v1/users/reset-password/${resetToken}">
             Reset password
           </a>`,
      });
    } catch (mailerror) {
      return res
        .status(500)
        .json({ error: "Failed to send Forgot password email" });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to email",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Something went wrong while resetting password" });
  }
};

const resetPassword = async function (req, res) {
  try {
    // collect token from params
    // password from req.body
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can login now.",
    });
  } catch (error) {
    console.error("Reset password error ❌", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const logoutUser = async function (req, res) {
  try {
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    return res.status(200).json({
      success: true,
      message: "User logout successfully",
    });
  } catch (error) {
    console.log(error, `Logout error`);
    return res.status(500).json({ error: "Server error" });
  }
};

export {
  registerUser,
  verifyUser,
  loginUser,
  logoutUser,
  userProfile,
  resendVerificationMail,
  forgotPassword,
  resetPassword,
};
