const mongoose = require("mongoose");
const slugify = require("slugify");
const seasonController = require("./../controllers/seasonController");
const seriesController = require("./../controllers/seriesController");
const commentController = require("./../controllers/commentController");
const replyController = require("./../controllers/replyController");
const videoController = require("./../controllers/videoController");
const AppError = require("./../utils/appError");

const episodeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Episode must have a name"],
      unique: true,
      trim: true,
      maxlength: [
        120,
        "A episode name must have less or equal than 120 characters",
      ],
      minlength: [
        3,
        "A episode name must have more or equal than 3 characters",
      ],
    },
    summary: {
      type: String,
      required: [true, "Episode must have a summary"],
      minlength: [
        10,
        "A episode summary must have more or equal than 10 characters",
      ],
    },
    number: {
      type: Number,
      required: [true, "Episode must have a number"],
    },
    sequenceNumber: {
      type: Number,
      required: [true, "Episode must have a sequenceNumber"],
    },
    premium: {
      type: Boolean,
      default: false,
    },
    filler: {
      type: Boolean,
      default: false,
    },
    series: {
      type: mongoose.Schema.ObjectId,
      ref: "Series",
      required: [true, "Episode must belong to a series"],
    },
    season: {
      type: mongoose.Schema.ObjectId,
      ref: "Season",
      required: [true, "Episode must belong to a season"],
    },
    commentsCount: { type: Number, default: 0 },
    mediaType: {
      type: String,
      required: [true, "A episode must have a mediaType"],
      enum: {
        values: ["episode", "movie"],
        message: "mediaType is either: episode , movie",
      },
    },
    images: {
      thumbnail: {
        type: [
          {
            height: {
              type: Number,
              required: [true, "The thumbnail.height field is required"],
            },
            source: {
              type: String,
              required: [true, "The thumbnail.source field is required"],
            },
            width: {
              type: Number,
              required: [true, "The thumbnail.width field is required"],
            },
          },
        ],
        validate: {
          validator: (v) => Array.isArray(v) && v.length > 0,
          message:
            "The images.thumbnail array must contain at least one element",
        },
      },
    },
    minutes: {
      type: Number,
      required: [true, "Episode must have minutes"],
    },
    slug: String,
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//Index
episodeSchema.index({ slug: 1 });

//virtual populates (Parent Reference as episode don't know anything about his video)
episodeSchema.virtual("video", {
  // when i get any episode i will get it's video
  ref: "Video", // model name
  foreignField: "episode", // in Video model
  localField: "_id", // in this model
});

//virtual populates
episodeSchema.virtual("comments", {
  // when i get any episode i will get it's comments
  ref: "Comment", // Comment model name
  foreignField: "episode", // in Comment model
  localField: "_id", // in this model
});

episodeSchema.pre("save", async function (next) {
  const seasonModel = seasonController.getModel();
  const seriesModel = seriesController.getModel();
  const relatedSeries = await seriesModel.findById(this.series);
  const relatedSeason = await seasonModel.findById(this.season);
  if (!relatedSeason) {
    return next(new AppError("Related season not found.", 400));
  }
  if (!relatedSeries) {
    return next(new AppError("Related series not found.", 400));
  }
  const newSlug = relatedSeason.slug + " E" + this.sequenceNumber;
  this.slug = slugify(newSlug, { lower: true });
  next();
});

//static method in mongo
episodeSchema.statics.calcEpCount = async function (seasonId) {
  const stats = await this.aggregate([
    {
      $match: { season: seasonId },
    },
    {
      $group: {
        _id: "$season",
        nDocs: { $sum: 1 },
      },
    },
  ]);

  //console.log("stats: ", stats);
  if (stats.length > 0) {
    seasonController.updateOneWithId(seasonId, {
      episodesCount: stats[0].nDocs,
    });
  } else {
    seasonController.updateOneWithId(seasonId, {
      episodesCount: 0,
    });
  }
};

//recalculate after saving
episodeSchema.post("save", function () {
  this.constructor.calcEpCount(this.season);
});

//add r to this before update or delete
episodeSchema.pre(/^findOneAnd/, async function (next) {
  //this.new_season = this._update.season;
  if (this._update?.season) {
    this.new_season = new mongoose.Types.ObjectId(this._update.season);
  }
  this.r = await this.model.findOne(this.getQuery());
  if (this.op == "findOneAndRemove") {
    //when delete =>
    // 1) delete all comments
    commentController.deleteAllComments({
      episode: this.r._id,
    });
    // 2) delete all replies
    replyController.deleteAllReplies({
      episode: this.r._id,
    });
    // 3) delete video
    videoController.deleteAllVideos({
      episode: this.r._id,
    });
    // 4) recalculate EpCount will be calculated next line
  }

  next();
});

//recalculate after update or delete
episodeSchema.post(/^findOneAnd/, async function () {
  if (this.op == "findOneAndUpdate") {
    if (this.new_season && !this.new_season.equals(this.r.season)) {
      //console.log("they are different:", this.new_season, this.r.season);
      await this.r.constructor.calcEpCount(this.new_season);
    }
  }

  await this.r.constructor.calcEpCount(this.r.season);
});

const Episode = mongoose.model("Episode", episodeSchema);
module.exports = Episode;
