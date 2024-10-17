const mongoose = require("mongoose");
const slugify = require("slugify");
const seriesController = require("./../controllers/seriesController");
const commentController = require("./../controllers/commentController");
const replyController = require("./../controllers/replyController");
const videoController = require("./../controllers/videoController");
const episodeController = require("./../controllers/episodeController");
const AppError = require("./../utils/appError");
const seasonSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A season must have a name"],
      unique: true,
      trim: true,
      maxlength: [
        120,
        "A season name must have less or equal than 120 characters",
      ],
      minlength: [3, "A season name must have more or equal than 3 characters"],
    },
    slug: String,
    number: {
      type: Number,
      required: [true, "A season must have a number"],
    },
    series: {
      type: mongoose.Schema.ObjectId,
      ref: "Series",
      required: [true, "Season must belong to a series"],
    },
    episodesCount: { type: Number, default: 0 },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Index
seasonSchema.index({ slug: 1 });

//virtual populates (Parent Reference as season don't know anything about his episode)
seasonSchema.virtual("episodes", {
  // when i get any season i will get it's episode
  ref: "Episode", // model name
  foreignField: "season", // in Episode model
  localField: "_id", // in this model
});

//DOCUMENT MIDDLEWARE
seasonSchema.pre("save", async function (next) {
  const seriesModel = seriesController.getModel();
  const relatedSeries = await seriesModel.findById(this.series);
  if (!relatedSeries) {
    return next(new AppError("Related series not found.", 400));
  }
  const newSlug = relatedSeries.slug + " S" + this.number;
  this.slug = slugify(newSlug, { lower: true });
  next();
});

//static method in mongo
seasonSchema.statics.calcSeasonCount = async function (seriesId) {
  const stats = await this.aggregate([
    {
      $match: { series: seriesId },
    },
    {
      $group: {
        _id: "$series",
        nDocs: { $sum: 1 },
      },
    },
  ]);

  //console.log("stats: ", stats);
  if (stats.length > 0) {
    seriesController.updateOneWithId(seriesId, {
      seasonsCount: stats[0].nDocs,
    });
  } else {
    seriesController.updateOneWithId(seriesId, {
      seasonsCount: 0,
    });
  }
};

//recalculate after saving
seasonSchema.post("save", function () {
  this.constructor.calcSeasonCount(this.series);
});

//add r to this before update or delete
seasonSchema.pre(/^findOneAnd/, async function (next) {
  if (this.op == "findOneAndUpdate") {
    if (this._update?.series) this._update.series = undefined;
    this.r = await this.model.findOne(this.getQuery());
  }
  if (this.op == "findOneAndRemove") {
    this.r = await this.model.findOne(this.getQuery()).populate({
      path: "episodes",
      select: "_id",
    });

    //when delete =>
    // 1) delete all episodes but one by one to run the nested remove for comments and replies
    //console.log(this.r);
    if (this.r?.episodes) {
      const groupPromises = this.r.episodes.map((ep) => {
        // 1) delete all comments
        commentController.deleteAllComments({
          episode: ep._id,
        });
        // 2) delete all replies
        replyController.deleteAllReplies({
          episode: ep._id,
        });
        // 3) delete video
        videoController.deleteAllVideos({
          episode: ep._id,
        });
      });
      await Promise.all(groupPromises);
    }
    episodeController.deleteAllEpisodes({ season: this.r._id });
    // 2) re calculate after delete this season in post
  }
  next();
});

//recalculate after update or delete
seasonSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcSeasonCount(this.r.series);
});

const Season = mongoose.model("Season", seasonSchema);

module.exports = Season;
