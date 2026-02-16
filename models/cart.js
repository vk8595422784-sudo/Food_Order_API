import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    unique: true
  },
  items: [
    {
      foodId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "food",
      },
      quantity: {
        type: Number,
        min: 1
      },
      priceSnapshot: Number
    }
  ]
},{timestamps:true})

const Cart = mongoose.model("cart",cartSchema)
export default Cart