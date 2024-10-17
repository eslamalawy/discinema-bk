const express = require("express");
const episodeController = require("../controllers/episodeController");
const authController = require("../controllers/authController");
const commentRouter = require("./../routes/commentRoutes");
const replyRouter = require("./../routes/replyRoutes");
const router = express.Router();

//mouting a router on this route
router.use("/:episodeId/comments", commentRouter); // just one another step to active the params on commentRouter
//for replies
router.use("/:episodeId/comment/:commentId/reply", replyRouter);

// for public
router.route("/").get(episodeController.getAllEpisodes);
router.route("/:id").get(episodeController.getEpisode);

//for admin
router.use(authController.protect, authController.restrictTo("admin"));
router.route("/").post(episodeController.createEpisode);

router
  .route("/:id")
  .patch(episodeController.updateEpisode)
  .delete(episodeController.deleteEpisode);

module.exports = router;
