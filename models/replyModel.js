const mongoose = require("mongoose");
const commentController = require("./../controllers/commentController");
const episodeController = require("./../controllers/episodeController");
const AppError = require("./../utils/appError");

const replySchema = new mongoose.Schema(
  {
    reply: {
      type: String,
      required: [true, "reply can not be empty!"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    comment: {
      type: mongoose.Schema.ObjectId,
      ref: "Comment",
      required: [true, "reply must belong to a comment."],
    },
    episode: {
      type: mongoose.Schema.ObjectId,
      ref: "Episode",
      required: [true, "reply must belong to a episode."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "reply must belong to a user."],
    },
  },
  {
    // options
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

replySchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo", // just the name photo
  });
  next();
});

//static method in mongo
replySchema.statics.calcRepliesCount = async function (episodeId) {
  const stats = await this.aggregate([
    {
      $match: { episode: episodeId },
    },
    {
      $group: {
        _id: "$episode",
        nDocs: { $sum: 1 },
      },
    },
  ]);

  const stats_comment = await commentController.getCommentsNumber(episodeId);
  // console.log("reply: stats: ", stats);
  // console.log("reply: comment: ", stats_comment);

  let sum = 0;
  if (stats.length > 0) sum += stats[0].nDocs;
  if (stats_comment.length > 0) sum += stats_comment[0].nDocs;

  if (stats_comment.length > 0 && sum > 0) {
    episodeController.updateOneWithId(episodeId, {
      commentsCount: sum,
    });
  } else {
    episodeController.updateOneWithId(episodeId, {
      commentsCount: 0,
    });
  }
};


replySchema.pre("save", async function (next) {
  const commentModel = commentController.getModel();
  const relatedComment = await commentModel.findById(this.comment);
  if (!relatedComment) {
    return next(new AppError("Related comment not found.", 400));
  }
  const episodeModel = episodeController.getModel();
  const relatedEpisode = await episodeModel.findById(this.episode);
  if (!relatedEpisode) {
    return next(new AppError("Related episode not found.", 400));
  }
  next();
});

//recalculate after saving
replySchema.post("save", function () {
  this.constructor.calcRepliesCount(this.episode);
});

//add r to this before update or delete
replySchema.pre(/^findOneAnd/, async function (next) {
  if (this.op == "findOneAndUpdate") {
    //console.log(this._update);
    if(this._update?.episode) this._update.episode = undefined;
    if(this._update?.comment) this._update.comment = undefined;
    //console.log("after",this._update);
  }
  this.r = await this.model.findOne(this.getQuery());
  next();
});

//recalculate after update or delete
replySchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcRepliesCount(this.r.episode);
});

const Reply = mongoose.model("Reply", replySchema);
module.exports = Reply;
