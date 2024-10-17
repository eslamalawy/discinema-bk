const express = require("express");
const replyController = require("./../controllers/replyController");
const authController = require("./../controllers/authController");

const router = express.Router({ mergeParams: true }); // this will activate the params to read them  // to get access to seriesId
//protect all comming after this middleware
router.use(authController.protect);

router
  .route("/")
  .get(replyController.getAllReplies)
  .post(
    authController.restrictTo("user"),
    replyController.setRepliesUserIds,
    replyController.createReply
  );

router
  .route("/:id")
  .get(replyController.getReply)
  .patch(
    authController.restrictTo("user", "admin"),
    replyController.validateUser,
    replyController.updateReply
  )
  .delete(
    authController.restrictTo("user", "admin"),
    replyController.validateUser,
    replyController.deleteReply
  ); // don't forget to add permissions
module.exports = router;
