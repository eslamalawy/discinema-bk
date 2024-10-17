const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const episodeController = require("./../controllers/episodeController");
const seriesController = require("./../controllers/seriesController");

const validSources = ["telegram", "googledrive", "onedrive"];

const videoSchema = mongoose.Schema(
  {
    //array of liks types look to images in series
    vids: {
      type: [
        {
          link: {
            type: String,
            required: [true, "The vids.link field is required"],
          },
          source: {
            type: String,
            required: [true, "The vids.source field is required"],
            enum: {
              values: validSources,
              message: `vids.source is either: ${validSources.toString()}`,
            },
          },
          mimeType: {
            type: String,
            required: [true, "The vids.mimeType field is required"],
          },
        },
      ],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "The vids array must contain at least one element",
      },
    },
    episode: {
      type: mongoose.Schema.ObjectId,
      ref: "Episode",
      unique: true,
      sparse: true, // allow only a null value
      validate: {
        validator: function (v) {
          if (this.series) {
            return false;
          }
          return true;
        },
        message: "You passed episode you should not pass series",
      },
      required: [
        function () {
          return !this.series;
        },
        "At least one of episode or series must be provided",
      ],
    },
    series: {
      type: mongoose.Schema.ObjectId,
      ref: "Series",
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          if (this.episode) {
            return false;
          }
          return true;
        },
        message: "You passed series you should not pass episode",
      },
      required: [
        function () {
          return !this.episode;
        },
        "At least one of episode or series must be provided",
      ],
    },
    logo: {
      type: String,
      required: [
        function () {
          return this.series;
        },
        "logo required for series",
      ],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

videoSchema.pre("save", async function (next) {
  if (this?.episode) {
    const episodeModel = episodeController.getModel();
    const relatedEpisode = await episodeModel.findById(this.episode);
    if (!relatedEpisode) {
      return next(new AppError("Related episode not found.", 400));
    }
  }

  if (this?.series) {
    const seriesModel = seriesController.getModel();
    const relatedSeries = await seriesModel.findById(this.series);
    if (!relatedSeries) {
      return next(new AppError("Related series not found.", 400));
    }
  }

  next();
});

//prevent add both series and episode in the update
videoSchema.pre("findOneAndUpdate", async function (next) {
  // Access the query from the `this` keyword
  const req = this._update;
  const id = this._conditions._id;

  // Check if episode and series are exist
  if (req.episode && req.series) {
    return next(
      new AppError("At least one of episode or series must be provided", 400)
    );
  }
  const oldVid = await this.model.findOne({ _id: id });

  //2) if it have episode and update with series [remove the episode]
  if (oldVid.episode != null && req.series) {
    if (!req.logo && !oldVid.logo) {
      return next(new AppError("logo required for series", 400));
    }

    this.findOneAndUpdate(
      {},
      { $unset: { episode: 1 } },
      { runValidators: false }
    ); // Unset the episode field in same query

    //console.log(this._update);
    //or
    // await this.model.findByIdAndUpdate(id, {
    //   $unset: { episode: 1 },
    // });
  }
  //3) if it have series and update with episode [remove the series]
  if (oldVid.series != null && req.episode) {
    if (req.logo && oldVid.logo) {
      return next(new AppError("logo not required for episode", 400));
    }
    this.findOneAndUpdate(
      {},
      { $unset: { series: 1, logo: 1 } },
      { runValidators: false }
    ); // Unset the series field in same qurey

    // console.log(this._update);

    //or
    // await this.model.findByIdAndUpdate(id, {
    //   $unset: { series: 1 },
    // });
  }

  next();
});

const Video = mongoose.model("Video", videoSchema);
module.exports = Video;
