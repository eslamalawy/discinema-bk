const factory = require("./handlerFactory");
const Episode = require("./../models/episodeModel");
const catchAsync = require("../utils/catchAsync");

exports.getAllEpisodes = factory.getAll(Episode);
exports.getEpisode = factory.getOne(Episode, [
  { path: "video", select: "-__v" },
  { path: "comments", select: "-__v" },
]);
exports.createEpisode = factory.createOne(Episode);
exports.updateEpisode = factory.updateOne(Episode);
exports.deleteEpisode = factory.deleteOne(Episode);

exports.updateOneWithId = (id, filter) =>
  factory.updateOneWithId(Episode, id, filter);

exports.deleteAllEpisodes = (delfilter) =>
  factory.deleteMany(Episode, delfilter);

exports.getModel = () => Episode;
