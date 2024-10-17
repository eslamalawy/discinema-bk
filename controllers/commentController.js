const Comment = require("./../models/commentModel");
const factory = require("./handlerFactory");

exports.setEpisodesUserIds = (req, res, next) => {
  // allow nested routes
  if (!req.body.episode) req.body.episode = req.params.episodeId;
  if (!req.body.user) req.body.user = req.user.id; // got from the auth protect
  next();
};

exports.validateUser = factory.validateUser(Comment);

exports.getAllComments = factory.getAll(Comment);
exports.getComment = factory.getOne(Comment);
exports.createComment = factory.createOne(Comment);
exports.updateComment = factory.updateOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);

exports.deleteAllComments = (delfilter) =>
  factory.deleteMany(Comment, delfilter);

exports.updateOneWithId = (id, filter) =>
  factory.updateOneWithId(Comment, id, filter);

exports.getCommentsNumber = async (episodeId) => {
  const stats_comment = await Comment.aggregate([
    // select all reviews related to this series
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
  return stats_comment;
};


exports.getModel = () => Comment;