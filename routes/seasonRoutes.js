const express = require("express");
const seasonController = require("../controllers/seasonController");
const authController = require("../controllers/authController");
const router = express.Router();

// for public
router.route("/").get(seasonController.getAllSeasons);
router.route("/:id").get(seasonController.getSeason);

//for admin
router.use(authController.protect, authController.restrictTo("admin"));
router.route("/").post(seasonController.createSeason);

router
  .route("/:id")
  .patch(seasonController.updateSeason)
  .delete(seasonController.deleteSeason);

module.exports = router;