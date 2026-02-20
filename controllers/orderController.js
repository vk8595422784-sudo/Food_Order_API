import Order from "../models/order.js";
import Cart from "../models/cart.js";

export const placeOrder = async (req, res) => {
  try {
    const { address, paymentMethod } = req.body;

    // Validate paymentMethod matches the enum in the model
    const validMethods = ["stripe", "cod"];
    const method = paymentMethod || "cod";
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        status: "fail",
        data: null,
        message: `paymentMethod must be one of: ${validMethods.join(", ")}`,
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        status: "fail",
        data: null,
        message: "Cart is empty",
      });
    }

    const totalAmount = cart.items.reduce(
      (sum, i) => sum + i.priceSnapshot * i.quantity,
      0,
    );

    const order = await Order.create({
      userId: req.user._id,
      items: cart.items,
      totalAmount,
      address: address || "",
      paymentMethod: method,
      status: "pending",
      paymentStatus: method === "cod" ? "unpaid" : "unpaid",
    });

    cart.items = [];
    await cart.save();

    return res.status(201).json({
      status: "success",
      data: order,
      message: "Order placed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: "success",
      data: orders,
      message: "Orders fetched",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        status: "fail",
        data: null,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: order,
      message: "Order fetched",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        status: "fail",
        data: null,
        message: "Order not found",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        status: "fail",
        data: null,
        message: `Cannot cancel an order with status "${order.status}". Only pending orders can be cancelled.`,
      });
    }

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({
      status: "success",
      data: order,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};
