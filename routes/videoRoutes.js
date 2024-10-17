const express = require("express");
const videoController = require("../controllers/videoController");
const authController = require("../controllers/authController");
const router = express.Router();

// for public
router.route("/").get(videoController.getAllVideos);
router.route("/:id").get(videoController.getVideo);

//for admin
router.use(authController.protect, authController.restrictTo("admin"));
router.route("/").post(videoController.createVideo);

router
  .route("/:id")
  .patch(videoController.updateVideo)
  .delete(videoController.deleteVideo);

module.exports = router;