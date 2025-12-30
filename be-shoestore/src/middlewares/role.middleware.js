const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
};

const isStaff = (req, res, next) => {
  if (req.user && ['admin', 'staff'].includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff role required.'
    });
  }
};

module.exports = {
  isAdmin,
  isStaff
};