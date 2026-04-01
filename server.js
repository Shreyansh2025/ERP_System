require('dotenv').config(); // This loads the .env file
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { sequelize, User, Role, Module, Permission } = require('./models');

const dashboardController = require('./controllers/dashboardController');
const customerController = require('./controllers/customerController');
const vendorController = require('./controllers/vendorController');
const categoryController = require('./controllers/categoryController');
const productController = require('./controllers/productController');
const purchaseOrderController = require('./controllers/purchaseOrderController');
const salesOrderController = require('./controllers/salesOrderController');
const customerPaymentController = require('./controllers/customerPaymentController');
const vendorPaymentController = require('./controllers/vendorPaymentController');
const ledgerController = require('./controllers/ledgerController');
const userController = require('./controllers/userController');

const app = express();
const cors = require('cors');
app.use(cors()); 
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const jwtSecret = process.env.JWT_SECRET;

// check user login token
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// check admin access
function adminMiddleware(req, res, next) {
    if (req.user.role !== 'Admin' && (req.user.permissions['Users'] || {}).read !== true) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
}
// Database connection test route
app.get('/api/health-check', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ 
            status: 'success', 
            message: 'Render is successfully connected to Aiven MySQL!' 
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Connection failed', 
            details: error.message 
        });
    }
});

// user login api
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({
            where: { email },
            include: [{ model: Role, as: 'role' }],
        });
        if (!user) {
            return res.status(401).json({ message: 'Wrong email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Wrong email or password' });
        }

        const userPerms = await Permission.findAll({
            where: { user_id: user.id },
            include: [{ model: Module, as: 'module', attributes: ['id', 'module_name'] }],
        });

        const permissions = {};
        userPerms.forEach(p => {
            if (!p.module) return;
            permissions[p.module.module_name] = {
                read: p.can_read,
                create: p.can_create,
                update: p.can_update,
                delete: p.can_delete,
            };
        });
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role?.role_name || '', permissions: permissions },
            jwtSecret,
            { expiresIn: '8h' }
        );
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id, name: user.name, email: user.email,
                role: user.role?.role_name || '',
                permissions,
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/dashboard/summary', authMiddleware, dashboardController.getSummary);

app.post('/api/customers', authMiddleware, customerController.create);
app.get('/api/customers', authMiddleware, customerController.getAll);
app.get('/api/customers/:id', authMiddleware, customerController.getById);
app.put('/api/customers/:id', authMiddleware, customerController.update);
app.delete('/api/customers/:id', authMiddleware, customerController.delete);

app.post('/api/vendors', authMiddleware, vendorController.create);
app.get('/api/vendors', authMiddleware, vendorController.getAll);
app.get('/api/vendors/:id', authMiddleware, vendorController.getById);
app.put('/api/vendors/:id', authMiddleware, vendorController.update);
app.delete('/api/vendors/:id', authMiddleware, vendorController.delete);

app.post('/api/categories', authMiddleware, categoryController.create);
app.get('/api/categories', authMiddleware, categoryController.getAll);
app.put('/api/categories/:id', authMiddleware, categoryController.update);
app.delete('/api/categories/:id', authMiddleware, categoryController.delete);

app.post('/api/products', authMiddleware, productController.create);
app.get('/api/products', authMiddleware, productController.getAll);
app.get('/api/products/:id', authMiddleware, productController.getById);
app.put('/api/products/:id', authMiddleware, productController.update);
app.delete('/api/products/:id', authMiddleware, productController.delete);

app.post('/api/purchaseOrders', authMiddleware, purchaseOrderController.create);
app.get('/api/purchaseOrders', authMiddleware, purchaseOrderController.getAll);
app.get('/api/purchaseOrders/:id', authMiddleware, purchaseOrderController.getById);
app.delete('/api/purchaseOrders/:id', authMiddleware, purchaseOrderController.delete);

app.post('/api/salesOrders', authMiddleware, salesOrderController.create);
app.get('/api/salesOrders', authMiddleware, salesOrderController.getAll);
app.get('/api/salesOrders/:id', authMiddleware, salesOrderController.getById);
app.delete('/api/salesOrders/:id', authMiddleware, salesOrderController.delete);

app.post('/api/customer-payments', authMiddleware, customerPaymentController.create);
app.get('/api/customer-payments', authMiddleware, customerPaymentController.getAll);
app.get('/api/customer-payments/summary/:sales_order_id', authMiddleware, customerPaymentController.getSummary);

app.post('/api/vendor-payments', authMiddleware, vendorPaymentController.create);
app.get('/api/vendor-payments', authMiddleware, vendorPaymentController.getAll);
app.get('/api/vendor-payments/summary/:purchase_order_id', authMiddleware, vendorPaymentController.getSummary);

app.get('/api/customers/:id/ledger', authMiddleware, ledgerController.getCustomerLedger);
app.get('/api/vendors/:id/ledger', authMiddleware, ledgerController.getVendorLedger);

app.post('/api/users', authMiddleware, adminMiddleware, userController.create);
app.get('/api/users', authMiddleware, adminMiddleware, userController.getAll);
app.get('/api/users/:id', authMiddleware, adminMiddleware, userController.getById);
app.put('/api/users/:id', authMiddleware, adminMiddleware, userController.update);
app.delete('/api/users/:id', authMiddleware, adminMiddleware, userController.delete);

// role management routes admin only
app.get('/api/roles', authMiddleware, adminMiddleware, userController.getRoles);
app.post('/api/roles', authMiddleware, adminMiddleware, userController.createRole);
app.put('/api/roles/:id', authMiddleware, adminMiddleware, userController.updateRole);
app.delete('/api/roles/:id', authMiddleware, adminMiddleware, userController.deleteRole);

// module routes admin only
app.get('/api/modules', authMiddleware, adminMiddleware, userController.getModules);

// permission routes admin only
app.get('/api/roles/:roleId/permissions', authMiddleware, adminMiddleware, userController.getRolePermissions);
app.get('/api/users/:userId/permissions', authMiddleware, adminMiddleware, userController.getUserPermissions);

// customer orders API
app.get('/api/customers/:id/orders', authMiddleware, async (req, res) => {
    try {
        const { SalesOrder, Customer } = require('./models');
        const orders = await SalesOrder.findAll({
            where: { customer_id: req.params.id },
            order: [['id', 'DESC']],
            include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
        });
        res.json({ data: orders });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// vendor orders API
app.get('/api/vendors/:id/orders', authMiddleware, async (req, res) => {
    try {
        const { PurchaseOrder, Vendor } = require('./models');
        const orders = await PurchaseOrder.findAll({
            where: { vendor_id: req.params.id },
            order: [['id', 'DESC']],
            include: [{ model: Vendor, as: 'vendor', attributes: ['name'] }],
        });
        res.json({ data: orders });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// all modules in the system
const ALL_MODULES = [
    'Dashboard', 'Customers', 'Vendors', 'Products', 'Categories',
    'Sales Orders', 'Purchase Orders',
    'Customer Payments', 'Vendor Payments',
    'Customer Ledger', 'Vendor Ledger',
    'Users',
];

// predefined roles and module permissions 
const PREDEFINED_ROLES = {
    Admin: ALL_MODULES,
    Manager: ['Dashboard', 'Customers', 'Vendors', 'Sales Orders', 'Purchase Orders', 'Customer Payments', 'Vendor Payments', 'Customer Ledger', 'Vendor Ledger'],
    Salesman: ['Dashboard', 'Customers', 'Products', 'Categories', 'Sales Orders', 'Customer Payments', 'Customer Ledger'],
};

async function seedRolesAndAdmin() {
    // seed modules
    const moduleMap = {};
    for (const moduleName of ALL_MODULES) {
        const [mod] = await Module.findOrCreate({ where: { module_name: moduleName } });
        moduleMap[moduleName] = mod.id;
    }

    // seed roles and permissions
    for (const [roleName, moduleNames] of Object.entries(PREDEFINED_ROLES)) {
        const [role] = await Role.findOrCreate({ where: { role_name: roleName } });
        for (const mName of moduleNames) {
            const moduleId = moduleMap[mName];
            if (moduleId) {
                await Permission.findOrCreate({
                    where: { role_id: role.id, module_id: moduleId, user_id: null },
                    defaults: { can_read: true, can_create: true, can_update: true, can_delete: true },
                });
            }
        }
    }

    // create default admin user if not exists
    const adminRole = await Role.findOne({ where: { role_name: 'Admin' } });
    const adminExists = await User.findOne({ where: { role_id: adminRole.id } });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = await User.create({ name: 'Admin', email: 'admin@admin.com', password: hashedPassword, role_id: adminRole.id });
        // copy role default permissions as admin user's own permissions
        for (const mName of PREDEFINED_ROLES.Admin) {
            const moduleId = moduleMap[mName];
            if (moduleId) {
                await Permission.findOrCreate({
                    where: { role_id: adminRole.id, module_id: moduleId, user_id: adminUser.id },
                    defaults: { can_read: true, can_create: true, can_update: true, can_delete: true },
                });
            }
        }
        console.log('Default admin created -> admin@admin.com / admin123');
    }
}

const PORT = process.env.PORT || 5000;

// sync db and start server
sequelize.sync({ alter: true })
    .then(async () => {
        console.log('DB synced');
        await seedRolesAndAdmin();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('DB sync failed:', err.message);
    });
