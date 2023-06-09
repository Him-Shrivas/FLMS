var mongoose = require("mongoose");
var leaveSchema = new mongoose.Schema(
  {
    subject: { type: String, required: "subject cant be blank" },
    from: Date,
    to: Date,
    days: Number,
    status: {
      type: String,
      enum: ["pending", "approved", "denied"],
      default: "pending"
    },
    principalstatus: {
      type: String,
      enum: ["pending", "approved", "denied"],
      default: "pending"
    },
    finalstatus: {
      type: String,
      enum: ["pending", "approved", "denied"],
      default: "pending"
    },
    approved: {
      type: Boolean,
      default: false
    },
    denied: {
      type: Boolean,
      default: false
    },
    // ol : {
    //   type : Number,
    //   default : 10
    // },
    // dl : {
    //   type : Number,
    //   default : 10
    // },
    // ml : {
    //   type : Number,
    //   default : 10
    // },
    // cl:{
    //   type : Number,
    //   default : 10
    // },
    stud: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty"
      },
      username: String
    }
  },
  { timestamps: {} }
);

module.exports = mongoose.model("Leave", leaveSchema);
