const express = require("express");
const seriesController = require("./../controllers/seriesController");
const authController = require("./../controllers/authController");
const reviewRouter = require("./../routes/reviewRoutes");
const router = express.Router();

//mouting a router on this route
router.use("/:seriesId/reviews", reviewRouter); // just one another step to active the params on reviewRouter

router.route("/search").post(seriesController.getSearchedSeries);

// for public
router.route("/").get(seriesController.getAllSeries);
router.route("/:id").get(seriesController.getSeries);

//for admin
router.use(authController.protect, authController.restrictTo("admin"));
router.route("/").post(seriesController.createSeries);

router
  .route("/:id")
  .patch(seriesController.updateSeries)
  .delete(seriesController.deleteSeries);

module.exports = router;
