const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Customer name is required"],
    trim: true 
  },
  mobile: { 
    type: String, 
    required: [true, "Mobile number is required"],
    unique: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit mobile number`
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
CustomerSchema.index({ mobile: 1 });
CustomerSchema.index({ name: 1 });

module.exports = mongoose.model("Customer", CustomerSchema);
