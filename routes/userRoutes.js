const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

// {getAllUsers}
const router = express.Router();

//these all are for public
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

//to protect all the following routes that come after that line of code
//means from this point all should be logined
// Protect all routes after this middleware
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);
router.get(
  "/me",
  userController.getMe, // to put the actual logged in user id to the req
  userController.getUser
);
router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete("/deleteMe", userController.deleteMe);

// Protect all routes after this middleware to [admin]
//means from this point all should be role admin to access these routes
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
