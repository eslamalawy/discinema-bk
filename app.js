const express = require("express");
const rateLimit = require("express-rate-limit"); // security
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const AppError = require("./utils/appError");
const golbalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const commentRouter = require("./routes/commentRoutes");
const replyRouter = require("./routes/replyRoutes");
const seriesRouter = require("./routes/seriesRoutes");
const seasonRouter = require("./routes/seasonRoutes");
const episodeRouter = require("./routes/episodeRoutes");
const videoRouter = require("./routes/videoRoutes");
const watchlistRouter = require("./routes/watchlistRoutes");
const cookieParser = require("cookie-parser");
const app = express();
app.enable("trust proxy"); //as heroku works as proxy,  to get all req info in auth controller jwt creation step


const corsOptions = {
  origin: 'http://localhost:3000', // Replace with the origin of your React app
  credentials: true, // Allow credentials (cookies) to be sent in the request
};



app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


// app.use(cors());
// app.options("*", cors());

// 1) GLOBAL MIDDLEWARES
// Set Security HTTP headers
app.use(helmet());

//to show the requests in console
// if (process.env.NODE_ENV.trim() === "development") {
//   app.use(morgan("dev"));
// }

//stop DOS ATTACT and Brute force attacs
// const limiter = rateLimit({
//   // limit requests from same IP
//   max: 100, // 100 requests per 1 hour
//   windowMs: 60 * 60 * 1000,
//   message: "Too many requrests from this IP, please try again in an hour!",
// });
// app.use("/api", limiter); // just on /api

//body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" })); // middleware that used to get the data from the request as json
app.use(cookieParser()); // to parse cookies

//Data sanitization against NoSQL query injection against "email": {"$gt": ""}
app.use(mongoSanitize());

//Data sanitization against XSS cross-site scripting attacts like  "name": "<div id='bad-code'>name</div>"
app.use(xss());

//prevent paramter pollution like {{URL}}api/v1/tours?sort=duration&sort=price it make it in single object
app.use(
  hpp({
    whitelist: [
      "duration",
      "price",
      "ratingsAverage",
      "difficulty",
      "maxGroupSize",
      "ratingQuantity",
    ], // to use {{URL}}api/v1/tours?duration=4&duration=2 // to not merge it
  })
);

//serving static files
app.use(express.static(`${__dirname}/public`));

// here is applied on all requests [Global middleware]
app.use((req, res, next) => {
  console.log("hey i'm global middleware");
  console.log("cookies: ",req.cookies);
  console.log(req.body)
  next();
});

// Test middleware
app.use((req, res, next) => {
  //console.log("hey i'm Time middleware");
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

//     route   [/api/v1/tours/:id/:y] if you want y to be optional paramter then add ? [/api/v1/tours/:id/:y?]
// called mounting router

// 3) ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/series", seriesRouter);
app.use("/api/v1/season", seasonRouter);
app.use("/api/v1/episode", episodeRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/replies", replyRouter);
app.use("/api/v1/watchlist", watchlistRouter);


//handel not hit routes  ---- handel all routes that not responded from the upper routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // whenever pass something to next it  will be an error to skil all other next middle ware till go to ERROR MIDDLE WARE HANDELER
});

//ERROR HANDELING MIDDLEWARE
app.use(golbalErrorHandler);

module.exports = app;
