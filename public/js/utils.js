function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const id = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-warning';
  container.innerHTML += `
    <div id="${id}" class="toast align-items-center text-white ${bgClass} border-0 show" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;
  setTimeout(() => { const el = document.getElementById(id); if (el) el.remove(); }, 4000);
}

function formatCurrency(amount) {
  return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function requireAuth() {
  if (!localStorage.getItem('erp_token')) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function setUserInfo() {
  const u = localStorage.getItem('erp_user');
  const user = u ? JSON.parse(u) : null;
  const el = document.getElementById('user-name');
  if (el && user) el.textContent = user.name;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// build pagination from total, page, limit values
function buildPagination(total, page, limit, onPageClick) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return '';
  let html = '<nav><ul class="pagination pagination-sm justify-content-center mb-0">';
  for (let i = 1; i <= totalPages; i++) {
    const active = i === page ? 'active' : '';
    html += `<li class="page-item ${active}"><a class="page-link" href="#" onclick="${onPageClick}(${i}); return false;">${i}</a></li>`;
  }
  html += '</ul></nav>';
  return html;
}

function confirmDelete(entityName) {
  return confirm(`Are you sure you want to delete this ${entityName}? This action cannot be undone.`);
}

function getStatusBadge(status) {
  const map = {
    paid: 'bg-success',
    partial: 'bg-warning text-dark',
    unpaid: 'bg-danger',
  };
  return `<span class="badge ${map[status] || 'bg-secondary'}">${status}</span>`;
}

// check if current user has access to a module (checks read permission by default)
function hasAccess(moduleName, action = 'read') {
  const user = JSON.parse(localStorage.getItem('erp_user') || '{}');
  if (user.role === 'Admin') return true;
  const perms = user.permissions || {};
  const modulePerm = perms[moduleName];
  if (!modulePerm) return false;
  if (action === 'read') return !!modulePerm.read;
  if (action === 'create') return !!modulePerm.create;
  if (action === 'update') return !!modulePerm.update;
  if (action === 'delete') return !!modulePerm.delete;
  return false;
}
