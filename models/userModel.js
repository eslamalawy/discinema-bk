const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email!"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password!"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password!"],
    validate: {
      // only working on SAVE and Create !! so that on update use user.save
      validator: function (el) {
        return el === this.password; // if both passwords are equals return true, else false
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
  PasswordResetToken: String,
  PasswordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  // in importing proccess comment if already have encrypted password
  if (!this.isModified("password")) return next(); // if password not modified , like update email, we will not encrypt password again
  this.password = await bcrypt.hash(this.password, 12); // 12 is the size of salt
  this.passwordConfirm = undefined; //to delete this field, not saving it in the mongodb
  next();
});

userSchema.pre("save", function (next) {
  // in importing proccess comment if already have encrypted password
  if (!this.isModified("password") || this.isNew) return next(); // this.isNew the doc is new
  this.passwordChangedAt = Date.now() - 1000; // because we need the token after the password always changed [respecting line 91 decoded.iat in authController]
  next();
});

// in instant methods that avilable in all docs
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  // this  - refare to current document
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; // 100 < 200  means changed
  }

  //False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.PasswordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.PasswordResetToken);
  this.PasswordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins to change this password
  return resetToken;
};

//query middleware
userSchema.pre(/^find/, function (next) {
  //this point to current document
  //we want just active users
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
