const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  // Check if no token
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded; // Contains { id, role }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const permit = (...allowedRoles) => {
  const isAllowed = role => {
    if (!role) return false;
    const cleanRole = role.toLowerCase().trim();
    return allowedRoles.some(r => r.toLowerCase().trim() === cleanRole);
  };
  
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (req.user && isAllowed(userRole)) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden: You don't have enough permissions" });
    }
  };
}

module.exports = { authMiddleware, permit };
