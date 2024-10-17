const mongoose = require("mongoose");
const slugify = require("slugify");

const commentController = require("./../controllers/commentController");
const replyController = require("./../controllers/replyController");
const videoController = require("./../controllers/videoController");
const episodeController = require("./../controllers/episodeController");
const seasonController = require("./../controllers/seasonController");
const reviewController = require("./../controllers/reviewController");
const watchlistController = require("./../controllers/watchlistController");

const verifyArray = (v) => {
  if (Array.isArray(v) && v.length > 0) {
    for (let i = 0; i < v.length; i++) {
      if (!v[i] || v[i].trim() === "") {
        return false;
      }
    }
    return true;
  }
  return false;
};

const validGenres = [
  "action",
  "adventure",
  "comedy",
  "drama",
  "fantasy",
  "horror",
  "mystery",
  "romance",
];

const seriesSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A series must have a name"],
      unique: true,
      trim: true,
      maxlength: [
        120,
        "A series name must have less or equal than 120 characters",
      ],
      minlength: [3, "A series name must have more or equal than 3 characters"],
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 1,
      min: [1, "min value is 1.0"],
      max: [5, "max value is 5.0"],
      set: (val) => Math.round(val * 10) / 10, // will run each time we set value // 4.6666 => 5 -- we want 4.7 so [4.6666* 10] 46.666 => rounded to 47 then /10 to 4.7
    },
    ratingsQuantity: { type: Number, default: 0 },
    description: {
      type: String,
      trim: true,
      required: [true, "A series must have a description"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    launchYear: {
      type: Number,
      required: [true, "A series must have a launchYear"],
    },
    images: {
      posterTall: {
        type: [
          {
            height: {
              type: Number,
              required: [true, "The posterTall.height field is required"],
            },
            source: {
              type: String,
              required: [true, "The posterTall.source field is required"],
            },
            width: {
              type: Number,
              required: [true, "The posterTall.width field is required"],
            },
          },
        ],
        validate: {
          validator: (v) => Array.isArray(v) && v.length > 0,
          message:
            "The images.posterTall array must contain at least one element",
        },
      },
      posterWide: {
        type: [
          {
            height: {
              type: Number,
              required: [true, "The posterWide.height field is required"],
            },
            source: {
              type: String,
              required: [true, "The posterWide.source field is required"],
            },
            width: {
              type: Number,
              required: [true, "The posterWide.width field is required"],
            },
          },
        ],
        validate: {
          validator: (v) => Array.isArray(v) && v.length > 0,
          message:
            "The images.posterWide array must contain at least one element",
        },
      },
    },
    seasonsCount: { type: Number, default: 0 },
    keywords: {
      type: [String],
      validate: {
        validator: (v) => verifyArray(v),
        message:
          "The keywords array must contain at least one element and non-empty fields",
      },
      required: [true, "The keywords field is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // hide it from output in the response
    },
    genres: {
      type: [
        {
          type: String,
          enum: {
            values: validGenres,
            message: `Genre is not valid, valid generes: ${validGenres.toString()}`,
          },
        },
      ],
      validate: {
        validator: (v) => verifyArray(v),
        message: "At least one of genres must be selected and non-empty fields",
      },
      required: true,
    },
  },
  {
    // options
    toJSON: { virtuals: true }, // all this does is to make sure that when we have a vertual property (basicly is a field that not stoerd inn the database but calculated by other values) so we want it to show up whenever where an output
    toObject: { virtuals: true },
  }
);

//Index
seriesSchema.index({ slug: 1 });

//virtual populates (Parent Reference as season don't know anything about his season)
seriesSchema.virtual("seasons", {
  // when i get any season i will get it's episode
  ref: "Season", // model name
  foreignField: "series", // in Season model
  localField: "_id", // in this model
});

//virtual populates
seriesSchema.virtual("reviews", {
  // when i get any series i will get it's reviews
  ref: "Review", // Review model name
  foreignField: "series", // in Review model
  localField: "_id", // in this model
});

seriesSchema.virtual("bannerVideo", {
  // when i get any series i will get it's video
  ref: "Video", // model name
  foreignField: "series", // in Video model
  localField: "_id", // in this model
});

//DOCUMENT MIDDLEWARE
seriesSchema.pre("save", function (next) {
  // same as express middleware  it have next
  this.slug = slugify(this.name, { lower: true });
  next();
});

//this for implementing refrencing
seriesSchema.pre(/^find/, function (next) {
  this.populate({
    // this refer to the query
    path: "bannerVideo",
    select: "-__v",
  });

  next();
});

//deleting series
seriesSchema.pre(/^findOneAnd/, async function (next) {
  if (this.op == "findOneAndRemove") {
    this.r = await this.model.findOne(this.getQuery());

    //when delete =>

    //find all episodes
    const ep = episodeController.getModel();
    const episodes = await ep.find({
      series: this.r._id,
    });

    let groupPromises = episodes.map((ep) => {
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
    //delete all episodes
    episodeController.deleteAllEpisodes({ series: this.r._id });
    //delete all seasons
    seasonController.deleteAllSeasons({ series: this.r._id });
    //delete all reviews
    reviewController.deleteAllReviews({ series: this.r._id });
    //delete all watchlists
    watchlistController.deleteAllWatchlists({ series: this.r._id });
    //delete all video banners if exist
    videoController.deleteAllVideos({ series: this.r._id });

    //ready to delete the series itself
  }
  next();
});

const Series = mongoose.model("Series", seriesSchema);

module.exports = Series;
