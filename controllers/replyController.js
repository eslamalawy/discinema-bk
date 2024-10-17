const Reply = require("./../models/replyModel");
const factory = require("./handlerFactory");

exports.setRepliesUserIds = (req, res, next) => {
  // allow nested routes
  if (!req.body.episode) req.body.episode = req.params.episodeId;
  if (!req.body.comment) req.body.comment = req.params.commentId;
  if (!req.body.user) req.body.user = req.user.id; // got from the auth protect
  next();
};

exports.validateUser = factory.validateUser(Reply);

exports.getAllReplies = factory.getAll(Reply);
exports.getReply = factory.getOne(Reply);
exports.createReply = factory.createOne(Reply);
exports.updateReply = factory.updateOne(Reply);
exports.deleteReply = factory.deleteOne(Reply);

exports.deleteAllReplies = (delfilter) => factory.deleteMany(Reply, delfilter);
exports.updateAllReplies = (filter, update) =>
  factory.updateMany(Reply, filter, update);

exports.updateOneWithId = (id, filter) =>
  factory.updateOneWithId(Reply, id, filter);

exports.getRepliesNumber = async (episodeId) => {
  const stats_reply = await Reply.aggregate([
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
  return stats_reply;
};
