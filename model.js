const mongoose = require("mongoose");
const schema= mongoose.Schema;

const user_schema = new schema({
  Rollno: {
    type: String,
    required: true,
  },
  Name: {
    type: String,
    required: true,
  },
  
  Phoneno: {
    type: String,
    required: true,
  },
    Year: {
    type: Number,
    required: true,
  },

  Parent: {
    type: String,
    required: true,
  },
  Prompt: {
    type: String,
    required: true,
  },
  Pass: {
    type: String,
    required: true,
  },
  TransactionId: {
    type: String,
    required: true,
  },
  Entry: {
    type: Boolean,
    required: true,
  },
  Paid: {
    type: Boolean,
    required: true,
  },
  
});
module.exports=mongoose.model("details",user_schema)