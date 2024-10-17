const Watchlist = require("./../models/watchlistModel");
const factory = require("./handlerFactory");

exports.setUserIds = (req, res, next) => {
    if (!req.body.user) req.body.user = req.user.id; // got from the auth protect
    next();
  };

exports.validateUser = factory.validateUser(Watchlist);

exports.getAllWatchlists = factory.getAll(Watchlist);
exports.getWatchlist = factory.getOne(Watchlist);
exports.createWatchlist = factory.createOne(Watchlist);
exports.deleteWatchlist = factory.deleteOne(Watchlist);

exports.deleteAllWatchlists = (delfilter) =>
  factory.deleteMany(Watchlist, delfilter);
