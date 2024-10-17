const mongoose = require("mongoose");
const dotenv = require("dotenv");


// handel uncaught exceptions like   console.log(anyundefiend_variable)
process.on("uncaughtException", (err) => {
  console.log(err.name, "-", err.message);
  console.log("UNCAUGHT Exception! 🔥 SHUTTING DOWN");
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
//useNewUrlParser, useUnifiedTopology, useFindAndModify, and useCreateIndex are no longer supported options. Mongoose 6 always behaves as if useNewUrlParser, useUnifiedTopology, and useCreateIndex are true, and useFindAndModify is false. Please remove these options from your code.
mongoose.connect(DB, {}).then((con) => {
  //console.log(con.connections);
  console.log("DB connection successfull");
});



const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}....`);
});

//handel all promise rejections here
process.on("unhandledRejection", (err) => {
  console.log(err.name, "-", err.message);
  console.log("UNHANDLER REJECTION! 🔥 SHUTTING DOWN");
  server.close(() => {
    process.exit(1);
  });
});
// data modeling 02:50:30  factory function