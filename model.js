const mongoose = require("mongoose");
const schema= mongoose.Schema;

const user_schema = new schema({
  name: {
    type: String,
    required: true,
  },
  rno: {
    type: String,
    required: true,
  },
  phno: {
    type: String,
    required: true,
  },
    id: {
    type: String,
    required: true,
  },

  uniqkey: {
    type: String,
    required: true,
  },
  entry: {
    type: Boolean,
    required: true,
  }
  
});
module.exports=mongoose.model("user",user_schema)