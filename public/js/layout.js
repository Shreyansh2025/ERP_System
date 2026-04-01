function renderLayout(pageTitle, activePage) {
  if (!requireAuth()) return;

  const ordersPages = ['sales_orders', 'purchase_orders'];
  const paymentsPages = ['customer_payments', 'vendor_payments'];
  const reportsPages = ['customer_ledger', 'vendor_ledger'];
  const settingsPages = ['categories', 'users'];

  // get current user info
  const currentUser = JSON.parse(localStorage.getItem('erp_user') || '{}');

  document.body.innerHTML = `
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <i class="bi bi-box-seam-fill"></i> Mini ERP
      </div>
      <div class="sidebar-nav">
        ${hasAccess('Dashboard') ? `<a href="dashboard.html" class="sidebar-link ${activePage === 'dashboard' ? 'active' : ''}">
          <i class="bi bi-speedometer2"></i> Dashboard
        </a>` : ''}

        ${hasAccess('Customers') ? `<a href="customers.html" class="sidebar-link ${activePage === 'customers' ? 'active' : ''}">
          <i class="bi bi-people-fill"></i> Customers
        </a>` : ''}

        ${hasAccess('Vendors') ? `<a href="vendors.html" class="sidebar-link ${activePage === 'vendors' ? 'active' : ''}">
          <i class="bi bi-truck"></i> Vendors
        </a>` : ''}

        ${hasAccess('Products') ? `<a href="products.html" class="sidebar-link ${activePage === 'products' ? 'active' : ''}">
          <i class="bi bi-box-fill"></i> Products
        </a>` : ''}

        ${(hasAccess('Sales Orders') || hasAccess('Purchase Orders')) ? `<div class="sidebar-group" id="group-orders">
          <div class="sidebar-group-toggle" onclick="toggleGroup(this)">
            <span><i class="bi bi-file-earmark-text"></i> Orders</span>
            <i class="bi bi-chevron-down sidebar-group-arrow"></i>
          </div>
          <div class="sidebar-group-items">
            ${hasAccess('Sales Orders') ? `<a href="salesOrders.html" class="sidebar-link ${activePage === 'sales_orders' ? 'active' : ''}">
              <i class="bi bi-receipt"></i> Sales Orders
            </a>` : ''}
            ${hasAccess('Purchase Orders') ? `<a href="purchaseOrders.html" class="sidebar-link ${activePage === 'purchase_orders' ? 'active' : ''}">
              <i class="bi bi-cart-fill"></i> Purchase Orders
            </a>` : ''}
          </div>
        </div>` : ''}

        ${(hasAccess('Customer Payments') || hasAccess('Vendor Payments')) ? `<div class="sidebar-group" id="group-payments">
          <div class="sidebar-group-toggle" onclick="toggleGroup(this)">
            <span><i class="bi bi-credit-card"></i> Payments</span>
            <i class="bi bi-chevron-down sidebar-group-arrow"></i>
          </div>
          <div class="sidebar-group-items">
            ${hasAccess('Customer Payments') ? `<a href="customer-payments.html" class="sidebar-link ${activePage === 'customer_payments' ? 'active' : ''}">
              <i class="bi bi-cash-stack"></i> Customer Payments
            </a>` : ''}
            ${hasAccess('Vendor Payments') ? `<a href="vendor-payments.html" class="sidebar-link ${activePage === 'vendor_payments' ? 'active' : ''}">
              <i class="bi bi-wallet2"></i> Vendor Payments
            </a>` : ''}
          </div>
        </div>` : ''}

        ${(hasAccess('Customer Ledger') || hasAccess('Vendor Ledger')) ? `<div class="sidebar-group" id="group-reports">
          <div class="sidebar-group-toggle" onclick="toggleGroup(this)">
            <span><i class="bi bi-bar-chart-line"></i> Reports</span>
            <i class="bi bi-chevron-down sidebar-group-arrow"></i>
          </div>
          <div class="sidebar-group-items">
            ${hasAccess('Customer Ledger') ? `<a href="customer-ledger.html" class="sidebar-link ${activePage === 'customer_ledger' ? 'active' : ''}">
              <i class="bi bi-journal-text"></i> Customer Ledger
            </a>` : ''}
            ${hasAccess('Vendor Ledger') ? `<a href="vendor-ledger.html" class="sidebar-link ${activePage === 'vendor_ledger' ? 'active' : ''}">
              <i class="bi bi-journal-bookmark"></i> Vendor Ledger
            </a>` : ''}
          </div>
        </div>` : ''}

        ${(hasAccess('Categories') || hasAccess('Users')) ? `<div class="sidebar-group" id="group-settings">
          <div class="sidebar-group-toggle" onclick="toggleGroup(this)">
            <span><i class="bi bi-gear-fill"></i> Settings</span>
            <i class="bi bi-chevron-down sidebar-group-arrow"></i>
          </div>
          <div class="sidebar-group-items">
            ${hasAccess('Categories') ? `<a href="categories.html" class="sidebar-link ${activePage === 'categories' ? 'active' : ''}">
              <i class="bi bi-tags-fill"></i> Categories
            </a>` : ''}
            ${hasAccess('Users') ? `<a href="users.html" class="sidebar-link ${activePage === 'users' ? 'active' : ''}">
              <i class="bi bi-person-gear"></i> Users
            </a>` : ''}
          </div>
        </div>` : ''}

      </div>
    </nav>

    <div class="main-content">
      <div class="topbar">
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-sm btn-outline-secondary d-md-none" onclick="document.getElementById('sidebar').classList.toggle('show')">
            <i class="bi bi-list"></i>
          </button>
          <span class="topbar-title">${pageTitle}</span>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="text-muted small"><i class="bi bi-person-circle"></i> <span id="user-name"></span></span>
          <button class="btn btn-sm btn-outline-danger" onclick="localStorage.removeItem('erp_token'); localStorage.removeItem('erp_user'); window.location.href='login.html'">
            <i class="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>
      <div class="page-content" id="page-content"></div>
    </div>
    <div id="toast-container"></div>
  `;

  setUserInfo();

  // auto-open the sidebar group that contains the active page
  if (ordersPages.includes(activePage))   document.getElementById('group-orders')?.classList.add('open');
  if (paymentsPages.includes(activePage)) document.getElementById('group-payments')?.classList.add('open');
  if (reportsPages.includes(activePage))  document.getElementById('group-reports')?.classList.add('open');
  if (settingsPages.includes(activePage)) document.getElementById('group-settings')?.classList.add('open');
}

function toggleGroup(el) {
  el.closest('.sidebar-group').classList.toggle('open');
}

function getPageContent() {
  return document.getElementById('page-content');
}
