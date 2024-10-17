const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndRemove(req.params.id);

    if (!doc) {
      return next(new AppError("no document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //this to return the new document
      runValidators: true, // check that it's okay with validation of schema
    });

    if (!doc) {
      return next(new AppError("no document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    //if (popOptions) query = query.populate(popOptions); // only works with object

    //works with array
    if (Array.isArray(popOptions) && popOptions.length > 0) {
      popOptions.forEach((option) => {
        query = query.populate(option);
      });
    } else if (typeof popOptions === "object" && popOptions !== null) {
      // also works with object
      query = query.populate(popOptions);
    }

    const doc = await query;
    if (!doc) {
      return next(new AppError("no document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //these 2 lines to allow for nested GET reviews on tour (hack)
    let filter = {};

    if (req.params?.episodeId) {
      filter.episode = req.params.episodeId;
    }
    if (req.params?.commentId) {
      filter.comment = req.params.commentId;
    }

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain(); // to test performance of nReturned and totalDocsExamined
    const doc = await features.query;
    //SEND RESPONCE
    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });

exports.validateUser = (Model) =>
  catchAsync(async (req, res, next) => {
    const r = await Model.findById(req.params.id); // .route("/:id")
    if (req.user.role == "user") {
      // this validate only on user not admin
      if (r.user._id != req.user.id) {
        return next(
          new AppError("This document not belongs to current user", 400)
        );
      }
    }
    //belongs to current user so can move on to next step
    next();
  });

exports.deleteMany = catchAsync(
  async (Model, delfilter) => await Model.deleteMany(delfilter)
);

exports.updateMany = catchAsync(async (Model, filter, update) => {
  await Model.updateMany(filter, update);
});

exports.updateOneWithId = catchAsync(
  async (Model, id, filter) => await Model.findByIdAndUpdate(id, filter)
);

