import Cart from '../models/cart.js'
import Food from '../models/food.js'

export const addToCart = async (req,res)=>{
  const {foodId,quantity} = req.body

  const food = Food.findById(foodId)

  if(!food){
    return res.status(404).json({
      status: "fail",
      data: null,
      message: "food not found"
    })
  }
  let cart = await Cart.findOne({userId: req.user._id})

  if(!cart){
    cart = await Cart.create({
      userId:req.user._id,
      items: []
    })
  }

  const item = cart.items.find((i)=> i.foodId.toString() === foodId)
  if(item) item.quantity += quantity
  else cart.items.push({foodId,quantity,priceSnapshot: food.price})

  await cart.save()

  res.json({
    status: "success",
    data: cart,
    message: "Cart Updated",
  });
}

export const getCart = async (req,res) =>{
  const cart = await Cart.findOne({userId:req.user._id}).populate("items.foodId")

    res.json({ status: "success", data: cart, message: "cart fetched" });
}

export const  removeItem = async (req,res)=>{
  const cart = await Cart.findOne({userId:req.user._id})
  cart.items = cart.items.filter((i)=> i.foodId.toString() !== req.params.foodId)

  await cart.save()

  res.json({ status: "success", data: cart, message: "item removed" });
}

export const clearCart = async (req,res)=>{
  const cart = await Cart.findOne({userId:req.user._id})
  cart.items = []
  await cart.save()

  res.json({ status: "success", data: cart, message: "cart cleared" });
}

