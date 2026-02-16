
import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name:{
    type:String,
    required: true,
    trim: true
  },
  description:{
    type:String,
  },
  price:{
    type:Number,
    required: true
  },
  category:{
    type: String,
  },
  available: {
    type: Boolean,
    default: true
  },
  imageUrl:{
    type:String
  }
},{timestamps:true})

const Food = mongoose.model("food",foodSchema)
export default Food



