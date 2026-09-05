import jwt from 'jsonwebtoken';

export const STAFF_ROLES = ['STAFF', 'NURSE', 'PHARMACIST', 'ACCOUNTANT', 'ADMIN'];
export const CLINICAL_ROLES = ['STAFF', 'NURSE', 'ADMIN', 'DOCTOR'];
export const PHARMACY_ROLES = ['STAFF', 'PHARMACIST', 'ADMIN', 'DOCTOR'];
export const FINANCE_ROLES = ['STAFF', 'ACCOUNTANT', 'ADMIN'];

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'RBAC: Bạn không có quyền thực hiện hành động này.' });
    }
    next();
  };
};
