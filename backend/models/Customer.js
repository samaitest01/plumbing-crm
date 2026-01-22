const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  name: String,
  mobile: { type: String, unique: true }
});

module.exports = mongoose.model("Customer", CustomerSchema);
