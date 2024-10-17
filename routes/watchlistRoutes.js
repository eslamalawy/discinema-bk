const express = require("express");
const watchlistController = require("./../controllers/watchlistController");
const authController = require("./../controllers/authController");

const router = express.Router({ mergeParams: true }); // this will activate the params to read them  // to get access to seriesId
//protect all comming after this middleware
router.use(authController.protect);

router
  .route("/")
  .get(watchlistController.getAllWatchlists)
  .post(
    authController.restrictTo("user"),
    watchlistController.setUserIds,
    watchlistController.createWatchlist
  );

router
  .route("/:id")
  .get(watchlistController.getWatchlist)
  .delete(
    authController.restrictTo("user", "admin"),
    watchlistController.validateUser,
    watchlistController.deleteWatchlist
  );
module.exports = router;
