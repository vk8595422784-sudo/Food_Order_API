import Cart from "../models/cart.js";
import Food from "../models/food.js";

export const addToCart = async (req, res) => {
  try {
    const { foodId, quantity } = req.body;

    // Validate inputs
    if (!foodId || !quantity) {
      return res.status(400).json({
        status: "fail",
        data: null,
        message: "foodId and quantity are required",
      });
    }
    if (typeof quantity !== "number" || quantity < 1) {
      return res.status(400).json({
        status: "fail",
        data: null,
        message: "quantity must be a positive number",
      });
    }

    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({
        status: "fail",
        data: null,
        message: "Food item not found",
      });
    }

    if (!food.available) {
      return res.status(400).json({
        status: "fail",
        data: null,
        message: "Food item is currently unavailable",
      });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    const existingItem = cart.items.find((i) => i.foodId.toString() === foodId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ foodId, quantity, priceSnapshot: food.price });
    }

    await cart.save();

    return res.status(200).json({
      status: "success",
      data: cart,
      message: "Cart updated",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate(
      "items.foodId",
    );

    return res.status(200).json({
      status: "success",
      data: cart || { items: [] },
      message: "Cart fetched",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

export const removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        status: "fail",
        data: null,
        message: "Cart not found",
      });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (i) => i.foodId.toString() !== req.params.foodId,
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        status: "fail",
        data: null,
        message: "Item not found in cart",
      });
    }

    await cart.save();

    return res.status(200).json({
      status: "success",
      data: cart,
      message: "Item removed from cart",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        status: "fail",
        data: null,
        message: "Cart not found",
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      status: "success",
      data: cart,
      message: "Cart cleared",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};
