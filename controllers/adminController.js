import Order from "../models/order.js";
import User from "../models/user.js";
import Food from "../models/food.js";

// GET /api/admin/orders — view ALL orders with user info
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      data: orders,
      message: "All orders fetched",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

// PUT /api/admin/orders/:id/status — update any order's status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "delivered", "cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "fail",
        data: null,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

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
      message: `Order status updated to "${status}"`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

// GET /api/admin/users — view all registered users (without passwords)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      data: users,
      message: "All users fetched",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

// DELETE /api/admin/users/:id — delete a user account
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        data: null,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: null,
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};

// GET /api/admin/stats — dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const [totalOrders, totalUsers, totalFoods, orders] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Food.countDocuments(),
      Order.find({ paymentStatus: "paid" }),
    ]);

    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0,
    );

    // Count orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusBreakdown = {};
    ordersByStatus.forEach(({ _id, count }) => {
      statusBreakdown[_id] = count;
    });

    return res.status(200).json({
      status: "success",
      data: {
        totalOrders,
        totalUsers,
        totalFoods,
        totalRevenue,
        ordersByStatus: statusBreakdown,
      },
      message: "Dashboard stats fetched",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      data: null,
      message: error.message,
    });
  }
};
