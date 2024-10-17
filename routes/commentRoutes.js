const express = require("express");
const commentController = require("./../controllers/commentController");
const authController = require("./../controllers/authController");

const router = express.Router({ mergeParams: true }); // this will activate the params to read them  // to get access to seriesId
//protect all comming after this middleware
router.use(authController.protect);

router
  .route("/")
  .get(commentController.getAllComments)
  .post(
    authController.restrictTo("user"),
    commentController.setEpisodesUserIds,
    commentController.createComment
  );

router
  .route("/:id")
  .get(commentController.getComment)
  .patch(
    authController.restrictTo("user", "admin"),
    commentController.validateUser,
    commentController.updateComment
  )
  .delete(
    authController.restrictTo("user", "admin"),
    commentController.validateUser,
    commentController.deleteComment
  ); // don't forget to add permissions
module.exports = router;
