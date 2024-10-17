// review / rating / createdAt / ref to tour / ref to user
const mongoose = require("mongoose");
const replyController = require("./../controllers/replyController");
const episodeController = require("./../controllers/episodeController");
const AppError = require("./../utils/appError");

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, "comment can not be empty!"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    episode: {
      type: mongoose.Schema.ObjectId,
      ref: "Episode",
      required: [true, "Comment must belong to a episode."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Comment must belong to a user."],
    },
  },
  {
    // options
    toJSON: { virtuals: true }, // all this does is to make sure that when we have a vertual property (basicly is a field that not stoerd inn the database but calculated by other values) so we want it to show up whenever where an output
    toObject: { virtuals: true },
  }
);

//populate replies on comment
commentSchema.virtual("replies", {
  ref: "Reply", // model name
  foreignField: "comment", // in Video model
  localField: "_id", // in this model
});

commentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo", // just the name photo
  });

  this.populate({
    path: "replies",
  });

  next();
});

//static method in mongo
commentSchema.statics.calcCommentCount = async function (episodeId) {
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

  const stats_reply = await replyController.getRepliesNumber(episodeId);

  // console.log(stats);
  let sum = 0;
  // console.log("comment: stats: ", stats);
  // console.log("comment: reply: ", stats_reply);

  if (stats.length > 0) sum += stats[0].nDocs;
  if (stats_reply.length > 0) sum += stats_reply[0].nDocs;

  if (stats.length > 0 && sum > 0) {
    episodeController.updateOneWithId(episodeId, {
      commentsCount: sum,
    });
  } else {
    episodeController.updateOneWithId(episodeId, {
      commentsCount: 0,
    });
  }
};
// just one comment for each user on a episode
// compound between series and user should be unique
commentSchema.index({ episode: 1, user: 1 }, { unique: true }); // doesn't matter that 1 or -1 here

commentSchema.pre("save", async function (next) {
  const episodeModel = episodeController.getModel();
  const relatedEpisode = await episodeModel.findById(this.episode);
  if (!relatedEpisode) {
    return next(new AppError("Related episode not found.", 400));
  }
  next();
});

commentSchema.post("save", function () {
  //this points to current comment
  //this.constructor // points to the Comment model
  this.constructor.calcCommentCount(this.episode); // we used this because to have it in the Comment model it should be before the Comment Declaration and we canno't access the Comment model before the declaration so we got the model from the comment document using this.constructor
});

// findByIdAndUpdate  --> short hand for findOneAndUpdate
// findByIdAndDelete  --> short hand for findOneAnd
// no pre middle ware for these events let's get them by other way
commentSchema.pre(/^findOneAnd/, async function (next) {
  if (this._update?.episode) {
    this.new_episode = new mongoose.Types.ObjectId(this._update.episode);
  }
  this.r = await this.model.findOne(this.getQuery());
  next();
});

commentSchema.post(/^findOneAnd/, async function () {
  if (this.op == "findOneAndUpdate") {
    if (this.new_episode && !this.new_episode.equals(this.r.episode)) {
      //console.log("they are different:", this.new_episode, this.r.episode);
      if (this.r.replies.length > 0) {
        //1)  change the all sub replies' episode of this comment
        replyController.updateAllReplies(
          {
            comment: this.r._id,
            episode: this.r.episode,
          },
          { $set: { episode: this.new_episode } }
        );
      }
      //2) calculate comment and replies count
      await this.r.constructor.calcCommentCount(this.new_episode);
    }
  }

  if (this.op == "findOneAndRemove") {
    replyController.deleteAllReplies({
      comment: this.r._id,
      episode: this.r.episode,
    });
  }
  await this.r.constructor.calcCommentCount(this.r.episode);
});

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
