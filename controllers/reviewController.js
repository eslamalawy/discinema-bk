const Review = require("./../models/reviewModel");
const factory = require("./handlerFactory");

exports.setSeriesUserIds = (req, res, next) => {
  // allow nested routes
  if (!req.body.series) req.body.series = req.params.seriesId;
  if (!req.body.user) req.body.user = req.user.id; // got from the auth protect
  next();
};

exports.validateUser = factory.validateUser(Review);

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

exports.deleteAllReviews = (delfilter) => factory.deleteMany(Review, delfilter);
