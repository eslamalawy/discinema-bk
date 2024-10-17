
class APIFeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      // 1A) FILTERING
      const queryObj = { ...this.queryString }; // create hard copy
      const excludedFields = ["page", "sort", "limit", "fields"];
      excludedFields.forEach((el) => delete queryObj[el]);
  
      //2B) Advanced filtering
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
      // gte, gt,lte,lt
  
      this.query.find(JSON.parse(queryStr));
      return this;
    }
    sort() {
      //2) sorting
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(",").join(" ");
        this.query = this.query.sort(sortBy);
        // sort('price ratingsAverage')
      } else {
        this.query = this.query.sort("-createdAt");
      }
      return this;
    }
  
    limitFields() {
      //3) Field limiting
      if (this.queryString.fields) {
        const fields = this.queryString.fields.split(",").join(' ');
        this.query = this.query.select(fields); // projecting
      } else {
        this.query = this.query.select("-__v"); // - minus for execluding
      }
  
      return this;
    }
  
    paginate() {
      //4) Pagination
      //page=2&limit=10
      // 1-10, page1  -> 11-20,page2  ->  21-30,page3   -> limit 10 means get 10 per page
      //skip(number of limit * page you want - 1) if result is 0 it will not skip anything and just show the limit
  
      const page = this.queryString.page * 1 || 1; // trick to convert to int
      const limit = this.queryString.limit * 1 || 100; // default is 100
      const skip = limit * (page - 1);
  
      this.query = this.query.skip(skip).limit(limit);
  
      // if (this.queryString.page) {
      //   const numTours = await Tour.countDocuments();
      //   if (skip >= numTours) throw new Error("this page does not exist!");
      // }
  
      return this;
    }
  }

  module.exports = APIFeatures;