// Must be used AFTER the auth middleware (which attaches req.user)
export const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "fail",
      data: null,
      message: "Access denied. Admins only.",
    });
  }
  next();
};

export default adminAuth;
