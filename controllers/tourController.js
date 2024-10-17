const Tour = require("./../models/tourModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: "reviews" });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: '$difficulty', // leave it null to get all // put value to categories by it
        // _id: null,
        _id: { $toUpper: "$difficulty" },
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: {
        avgPrice: 1, // 1 for asynding
      },
    },
    //{
    //   $match: { _id: { $ne: "EASY" } }, // not the easy ones
    // },
  ]);
  res.status(200).json({
    status: "success",
    data: { stats },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" }, // group by th pipeline operator the month which extracts the month from a date which is $startDate
        numToursStarts: { $sum: 1 },
        tours: { $push: "$name" }, // to create array
      },
    },
    {
      $addFields: { month: "$_id" }, // name of field and value here the value comes from the id field
    },
    {
      $project: { _id: 0 }, // the id will not show up , value 0 means hide it, otherwise 1 will show
    },
    {
      $sort: { numToursStarts: -1 }, // 1 for asynding  -1 for descynding
    },
    {
      $limit: 12, // 12 outputs per page
    },
  ]);

  res.status(200).json({
    status: "success",
    data: { plan },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(","); // latitutr , longitude

  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitutr and longitude in the format lat,lng",
        400
      )
    );
  }
  //console.log(distance, lat, lng, unit);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(","); // latitutr , longitude

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitutr and longitude in the format lat,lng",
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        // require a geo index which in our case startLocation
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1], // * 1 to convert them to numbers
        },
        distanceField: "distance",
        distanceMultiplier: multiplier, //0.001 = the same as deviding /1000
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      data: distances,
    },
  });
});
