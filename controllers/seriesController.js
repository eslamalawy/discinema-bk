const catchAsync = require("../utils/catchAsync");
const Series = require("./../models/seriesModel");
const factory = require("./handlerFactory");

exports.getAllSeries = factory.getAll(Series);
exports.getSeries = factory.getOne(Series, [
  { path: "seasons", select: "-__v" },
  { path: "reviews", select: "-__v" },
]);
exports.createSeries = factory.createOne(Series);
exports.updateSeries = factory.updateOne(Series);
exports.deleteSeries = factory.deleteOne(Series);

exports.updateOneWithId = (id, filter) =>
  factory.updateOneWithId(Series, id, filter);

exports.getModel = () => Series;

exports.getSearchedSeries = catchAsync(async (req, res, next) => {
  const { searchKey } = req.body;
  const regex = new RegExp(searchKey, "i"); // Case-insensitive search regex

  const data = await Series.find({
    $or: [
      { name: regex }, // Search in the "name" field
      { description: regex }, // Search in the "description" field
      { keywords: regex }, // Search in the "keywords" array
    ],
  });

  res.status(200).json({
    status: "success",
    results: data.length,
    data,
  });
});
