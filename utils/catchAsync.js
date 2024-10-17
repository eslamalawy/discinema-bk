module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
    // the same as    fn(req, res, next).catch((err) => next(err));
  };
};
