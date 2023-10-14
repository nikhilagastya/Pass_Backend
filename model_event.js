const mongoose = require("mongoose");
const schema= mongoose.Schema;

const user_schema = new schema({
  
 
  Rollno: {
    type: String,
    required: true,
  }
  
  
  
});
module.exports=mongoose.model("Events",user_schema)