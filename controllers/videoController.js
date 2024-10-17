const Video = require("../models/videoModel");
const factory = require("./handlerFactory");


exports.getAllVideos = factory.getAll(Video);
exports.getVideo = factory.getOne(Video);
exports.createVideo = factory.createOne(Video);
exports.updateVideo = factory.updateOne(Video);
exports.deleteVideo = factory.deleteOne(Video);

exports.deleteAllVideos = (delfilter) => factory.deleteMany(Video, delfilter);