const mongoose = require("mongoose");
const schema= mongoose.Schema;

const user_schema = new schema({
  
  TransactionId: {
    type: String,
    required: true,
  }
  
  
});
module.exports=mongoose.model("transactions",user_schema)