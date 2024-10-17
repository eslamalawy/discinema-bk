const multer = require("multer"); // helpfull in uploading images
const sharp = require("sharp"); // to do munipulation on image , like corp image or whatever
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // cb is callback function similler to next
//     cb(null, "public/img/users"); // null is the error
//   },
//   filename: (req, file, cb) => {
//     //user-userid-timestamp.jpeg
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// exports.checkID = (req,res,next,val)=>{
//   console.log(`USER id is: ${val}`);
//   //console.log(req.params);
//   const id = val * 1; //trick to convert to number
//   const tour = user.find(elm)( => elm.id === id);

//   if (!user) {
//     // best solution
//     return res.status(404).json({
//       status: "fail",
//       message: "Invalid Id",
//     });
//   }
// }

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create Error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        `This route is not for password updates. Please use /upadeteMyPassword`,
        400
      )
    );
  }

  // 2) filterred out unwanted fileds names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email"); // keep name and email only
  //2.5) check if there is a photo
  if (req.file) filteredBody.photo = req.file.filename;
  
  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  }); // because if we used save it will validate [password] and we don't need that
  //new: true to return the object
  res.status(200).json({
    status: "success",
    user: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

//create user without role route
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "this route not defined! please use /signup instead",
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// Do Not update passwords with this! because all save middlewares not run
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
