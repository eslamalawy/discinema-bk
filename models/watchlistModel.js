const mongoose = require("mongoose");
const seriesController = require("./../controllers/seriesController");
const AppError = require("./../utils/appError");

const watchlistSchema = new mongoose.Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    series: {
      type: mongoose.Schema.ObjectId,
      ref: "Series",
      required: [true, "Watchlist must belong to a series"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Watchlist must belong to a user."],
    },
  },
  {
    // options
    toJSON: { virtuals: true }, // all this does is to make sure that when we have a vertual property (basicly is a field that not stoerd inn the database but calculated by other values) so we want it to show up whenever where an output
    toObject: { virtuals: true },
  }
);

watchlistSchema.pre(/^find/, function (next) {
  this.populate({
    path: "series",
  });
  this.populate({
    path: "user",
  });
  next();
});

// just one watchlist for each user on a series
// compound between series and user should be unique
watchlistSchema.index({ series: 1, user: 1 }, { unique: true }); // doesn't matter that 1 or -1 here

watchlistSchema.pre("save", async function (next) {
  const seriesModel = seriesController.getModel();
  const relatedSeries = await seriesModel.findById(this.series);
  if (!relatedSeries) {
    return next(new AppError("Related series not found.", 400));
  }
  next();
});

const Watchlist = mongoose.model("Watchlist", watchlistSchema);
module.exports = Watchlist;
