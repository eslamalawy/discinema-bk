const Season = require("../models/seasonModel");
const factory = require("./handlerFactory");

exports.getAllSeasons = factory.getAll(Season);
exports.getSeason = factory.getOne(Season, {
  path: "episodes",
  select: "-__v",
});
exports.createSeason = factory.createOne(Season);
exports.updateSeason = factory.updateOne(Season);
exports.deleteSeason = factory.deleteOne(Season);

exports.updateOneWithId = (id, filter) =>
  factory.updateOneWithId(Season, id, filter);

exports.deleteAllSeasons = (delfilter) => factory.deleteMany(Season, delfilter);

exports.getModel = () => Season;
