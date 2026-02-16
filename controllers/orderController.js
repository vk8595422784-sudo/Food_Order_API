import Order from "../models/order.js"
import Cart from "../models/cart.js"

export const placeOrder = async (req,res) =>{
  const cart = await Cart.findOne({userId:req.user._id})
  if(!cart || cart.items.length === 0){
    return res
    .status(400)
    .json({status: "fail",data:null, message: "cart empaty"})

  }

  const total = cart.items.reduce((sum,i)=> sum + i.priceSnapshot * i.quantity,0)

  const order = await Order.create({
    userId: req.user._id,
    items: cart.items,
    totalAmount: total,
    address: req.body.address,
    paymentMethod: req.body.paymentMethod
  })

  cart.items = []
  await cart.save()
  res.json({status: "success", data: order, message: "order placed"})
}

export const getMyOrders = async (req,res)=>{
  const order = await Order.find({userId: req.user._id})
  res.json({ status: "success", data: order, message: "ordered fetched" })
}

export const getOrderById = async (req,res)=>{
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user._id
  })

  if(!order){
    return res
    .status(404)
    .json({status: "fail", data: null, message: "not found" })
  }

   res.json({ status: "success", data: order, message: "order fetched" });

}

export const cancelOrder = async (req,res)=>{
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user._id
  })
  if(!order || order.status !== "pending")
    return res
      .status(400)
      .json({status: "fail",data: null, message: "cancel order"})
  
  order.status = "cancelled"
  await order.save()

  res.json({ status: "success", data: order, message: "order canceleld" });
}