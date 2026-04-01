const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User, Role, Module, Permission } = require('../models');

// create new user with permissions
exports.create = async (req, res) => {
  try {
    const { name, email, password, role_id, permissions } = req.body;
    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }
    const role = await Role.findByPk(role_id);
    if (!role) return res.status(400).json({ message: 'Invalid role' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role_id });

    if (permissions && Array.isArray(permissions)) {
      for (const p of permissions) {
        await Permission.create({
          role_id, module_id: p.module_id, user_id: user.id,
          can_read: !!p.can_read, can_create: !!p.can_create,
          can_update: !!p.can_update, can_delete: !!p.can_delete,
        });
      }
    }

    res.status(201).json({ message: 'User created', data: { id: user.id, name: user.name, email: user.email, role_id: user.role_id } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get all users 
exports.getAll = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await User.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset), order: [['id', 'DESC']],
      attributes: ['id', 'name', 'email', 'role_id', 'created_at'],
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_name'] }],
    });
    res.json({ data: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get user by id
exports.getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'role_id', 'created_at'],
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_name'] }],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ data: user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// update user 
exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, password } = req.body;

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Email already exists' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await user.update(updateData);

    res.json({ message: 'User updated', data: { id: user.id, name: user.name, email: user.email, role_id: user.role_id } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// delete user account
exports.delete = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get all roles with permissions
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: [{
        model: Permission, as: 'permissions',
        where: { user_id: null },
        required: false,
        include: [{ model: Module, as: 'module', attributes: ['id', 'module_name'] }],
      }],
      order: [['id', 'ASC']],
    });
    res.json({ data: roles });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// create role with permissions
exports.createRole = async (req, res) => {
  try {
    const { role_name, permissions } = req.body;
    if (!role_name) return res.status(400).json({ message: 'Role name is required' });

    const existing = await Role.findOne({ where: { role_name } });
    if (existing) return res.status(409).json({ message: 'Role name already exists' });

    const role = await Role.create({ role_name });

    if (permissions && Array.isArray(permissions)) {
      for (const p of permissions) {
        await Permission.create({
          role_id: role.id,
          module_id: p.module_id,
          can_read: !!p.can_read,
          can_create: !!p.can_create,
          can_update: !!p.can_update,
          can_delete: !!p.can_delete,
        });
      }
    }

    res.status(201).json({ message: 'Role created', data: role });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// update role name and permissions
exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    const { role_name, permissions } = req.body;

    if (role_name && role_name !== role.role_name) {
      const existing = await Role.findOne({ where: { role_name } });
      if (existing) return res.status(409).json({ message: 'Role name already exists' });
      await role.update({ role_name });
    }

    if (permissions && Array.isArray(permissions)) {
      await Permission.destroy({ where: { role_id: role.id, user_id: null } });
      for (const p of permissions) {
        await Permission.create({
          role_id: role.id,
          module_id: p.module_id,
          can_read: !!p.can_read,
          can_create: !!p.can_create,
          can_update: !!p.can_update,
          can_delete: !!p.can_delete,
        });
      }
    }

    res.json({ message: 'Role updated' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// delete role if no users assigned
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    const userCount = await User.count({ where: { role_id: role.id } });
    if (userCount > 0) return res.status(400).json({ message: `Cannot delete role, ${userCount} user(s) are assigned to it` });

    await Permission.destroy({ where: { role_id: role.id } });
    await role.destroy();
    res.json({ message: 'Role deleted' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get all modules list
exports.getModules = async (req, res) => {
  try {
    const modules = await Module.findAll({ order: [['id', 'ASC']] });
    res.json({ data: modules });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get role permissions
exports.getRolePermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      where: { role_id: req.params.roleId, user_id: null },
      include: [{ model: Module, as: 'module', attributes: ['id', 'module_name'] }],
    });
    res.json({ data: permissions });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// get user permissions
exports.getUserPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      where: { user_id: req.params.userId },
      include: [{ model: Module, as: 'module', attributes: ['id', 'module_name'] }],
    });
    res.json({ data: permissions });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
};

