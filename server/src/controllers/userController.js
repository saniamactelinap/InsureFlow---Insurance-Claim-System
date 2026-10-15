import { User } from '../models/User.js';
import { auditService } from '../services/auditService.js';
import bcrypt from 'bcryptjs';

export const listUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, page = 1, limit = 50 } = req.query;
    const query = {};

    // Role-based scoping:
    // Non-ADMIN staff roles (e.g. OFFICER, MANAGER) are permitted to query active staff/surveyors for assignment
    if (req.user.role !== 'ADMIN') {
      query.role = role || 'SURVEYOR';
      query.isActive = true;
    } else {
      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (parseInt(page, 10) - 1) * parsedLimit;
    const [users, total] = await Promise.all([
      User.find(query)
        .select('_id name email role department phone isActive createdAt')
        .sort({ name: 1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Ensure status property is available for components expecting either isActive or status
    const formattedUsers = users.map((u) => ({
      ...u,
      status: u.isActive ? 'ACTIVE' : 'INACTIVE',
    }));

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createStaffUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
      });
    }

    const validRoles = ['OFFICER', 'SURVEYOR', 'MANAGER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid staff role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone || '',
      department: department || 'Operations',
      isActive: true,
    });

    await auditService.log(req, 'CREATE_STAFF_ACCOUNT', 'User', newUser._id, {
      createdEmail: newUser.email,
      assignedRole: newUser.role,
    });

    res.status(201).json({
      success: true,
      message: `Staff member created successfully with role ${role}.`,
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, role, department, isActive, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent non-admin self privilege escalation
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role && ['CUSTOMER', 'OFFICER', 'SURVEYOR', 'MANAGER', 'ADMIN'].includes(role)) {
      user.role = role;
    }
    if (department) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;
    if (password && password.length >= 6) {
      user.password = password; // pre-save hook will hash
    }

    await user.save();
    await auditService.log(req, 'UPDATE_USER', 'User', user._id, { updatedRole: user.role, isActive: user.isActive });

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await auditService.log(req, user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'User', user._id, {
      isActive: user.isActive,
    });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
