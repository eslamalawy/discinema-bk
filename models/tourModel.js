const mongoose = require("mongoose");
const slugify = require("slugify");
//const User = require("./userModel"); // imported for embadding
//const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have less or equal than 40 characters"],
      minlength: [10, "A tour name must have more or equal than 10 characters"],
      // validate: [validator.isAlpha,'A tour name must contain character']
    },
    slug: String,
    duration: { type: Number, required: [true, "A tour must have a duration"] },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "difficulty is either: easy , medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "min value is 1.0"],
      max: [5, "max value is 5.0"],
      set: (val) => Math.round(val * 10) / 10, // will run each time we set value // 4.6666 => 5 -- we want 4.7 so [4.6666* 10] 46.666 => rounded to 47 then /10 to 4.7
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, "A tour must have a price"] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price; // will work only on create not update
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // hide it from output in the response
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point", // lines - poligon - multible poligons
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      // array
      {
        // of objects similar to startLocation
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //guides: Array, // for embadding
    guides: [
      // for reference , we need to populate them , in tour contoller
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    // options
    toJSON: { virtuals: true }, // all this does is to make sure that when we have a vertual property (basicly is a field that not stoerd inn the database but calculated by other values) so we want it to show up whenever where an output
    toObject: { virtuals: true },
  }
);

// index  to low the totalDocsExamined to get more performace and speed
// works perfect on this : {{URL}}api/v1/tours?price[lt]=1000
// tourSchema.index({ price: 1 }); // means we are sorting the price index by Asynding order --- and -1 means Desynding order

// compound index // have 2 or more this time
// works perfect on this : {{URL}}api/v1/tours?price[lt]=1000&ratingsAverage[gte]=4.7
// works perfect aswell with : {{URL}}api/v1/tours?price[lt]=1000
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" }); //this will be sphere location on the earth

// VIRTUALS
tourSchema.virtual("durationWeeks").get(function () {
  // this concedered a virtual property
  //not arrow function because we need to use [this] keyword, in arrow fnc we can't use this
  return this.duration / 7;
});

//virtual populates
tourSchema.virtual("reviews", {
  // when i get any tour i will get it's reviews
  ref: "Review", // Review model name
  foreignField: "tour", // in Review model
  localField: "_id", // in this model
});

// DOCUMENT MIDDLEWARE : runs before .save(), and .create(),  [.insertMany not works with it]
tourSchema.pre("save", function (next) {
  // same as express middleware  it have next
  this.slug = slugify(this.name, { lower: true });
  next();
});

// implements embadding
// embadding guides before save in the document by ids
// tourSchema.pre("save", async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises); // because the result of the map is a array of promises
//   next();

//   // Now at this simple code that be implemented here of course only works for creating new documents
//   // NOT For updating them, right?
//   // So now, we would have to go ahead and implement the same logic also for updates However,
//   // I'm not going to do that because remember from the video where we modeled or data
//   // that there are actually some drawbacks of embadding the data in this case
//   // For example imagine that a tour guide updates his email address or
//   // they change the role from guide to lead guide
//   // Each time one of these changes would happened then
//   // you'll have to check if a tour has that user as a guide and if so then update the tour as well
//   // And so that's really a lot of work and we're not going to go in that direction

// });

// tourSchema.pre("save", function (next) { // can have many hooks on same
//   console.log("Will save the document ...")
//   next();
// });

// // pre and post are named hooks or middleware
// tourSchema.post("save", function (doc,next) { // doc is the already doc saved in db
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  // findone will not work we need regular expression to fix it, and this will work for all find operations like [findByIdAndUpdate or whatever start with find]
  //tourSchema.pre('find',function(next){//this works before query, and not for all find queries just with find not with findOne or others
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();

  next();
});

// for populate that fill the data in get tour or get all tours
//this for implementing refrencing
tourSchema.pre(/^find/, function (next) {
  this.populate({
    // this refer to the query
    path: "guides",
    select: "-__v -passwordChangedAt",
  }); // it will fill the guides in the tour model

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  //console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre("aggregate", function (next) {

  if(!this.pipeline().at(0).$geoNear){
    //console.log(this.pipeline().at(0).$geoNear, "Not Exist");
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  }
 

  //shift add to the end of the array as the pipeline is array
  //unshift add to front of array
  //console.log(this.pipeline());
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
