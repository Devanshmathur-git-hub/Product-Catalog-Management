const API_BASE_URL = 'http://localhost:3000/products'; // or your real endpoint
// Utility to build query string with optional params
function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// DOM elements
const productsBody = document.getElementById('productsBody');
const productsCount = document.getElementById('productsCount');
const listLoading = document.getElementById('listLoading');
const listError = document.getElementById('listError');

const filtersForm = document.getElementById('filters-form');
const resetFiltersButton = document.getElementById('resetFilters');

const productForm = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const saveButton = document.getElementById('saveButton');
const cancelEditButton = document.getElementById('cancelEditButton');
const formStatus = document.getElementById('formStatus');

let isEditing = false;

async function fetchProducts() {
  listError.classList.add('hidden');
  listLoading.classList.remove('hidden');

  const formData = new FormData(filtersForm);
  const query = buildQuery({
    search: formData.get('search') || undefined,
    category: formData.get('category') || undefined,
    minPrice: formData.get('minPrice') || undefined,
    maxPrice: formData.get('maxPrice') || undefined,
    sort: formData.get('sort') || undefined,
  });

  try {
    const res = await fetch(`${API_BASE_URL}${query}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch products. Status ${res.status}`);
    }
    const data = await res.json();
    renderProducts(Array.isArray(data) ? data : data.items || []);
  } catch (err) {
    console.error(err);
    listError.textContent =
      'Unable to load products. Check that your API is running and API_BASE_URL is correct.';
    listError.classList.remove('hidden');
    renderProducts([]);
  } finally {
    listLoading.classList.add('hidden');
  }
}

function renderProducts(products) {
  productsBody.innerHTML = '';

  if (!products.length) {
    productsBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          No products found for the current filters.
        </td>
      </tr>
    `;
    productsCount.textContent = '0 items';
    return;
  }

  productsCount.textContent =
    products.length === 1 ? '1 item' : `${products.length} items`;

  for (const product of products) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <button class="link-btn" data-action="view" data-id="${product.id}">
          ${escapeHtml(product.name ?? '')}
        </button>
      </td>
      <td>${escapeHtml(product.category ?? '')}</td>
      <td class="numeric">$${Number(product.price ?? 0).toFixed(2)}</td>
      <td class="numeric">${Number(product.stockCount ?? 0)}</td>
      <td class="actions-cell">
        <button class="btn small ghost" data-action="edit" data-id="${product.id}">
          Edit
        </button>
        <button class="btn small danger" data-action="delete" data-id="${product.id}">
          Delete
        </button>
      </td>
    `;
    productsBody.appendChild(tr);
  }
}

// Simple HTML escape to avoid accidental injection in text content
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function handleSaveProduct(event) {
  event.preventDefault();
  formStatus.textContent = '';

  const formData = new FormData(productForm);
  const id = formData.get('id') || document.getElementById('productId').value;

  const payload = {
    name: formData.get('name')?.trim(),
    description: formData.get('description')?.trim(),
    price: formData.get('price') ? Number(formData.get('price')) : 0,
    category: formData.get('category')?.trim(),
    stockCount: formData.get('stockCount')
      ? Number(formData.get('stockCount'))
      : 0,
  };

  if (!payload.name || !payload.category) {
    formStatus.textContent = 'Name and category are required.';
    formStatus.classList.add('error');
    return;
  }

  saveButton.disabled = true;
  cancelEditButton.disabled = true;

  try {
    const url = isEditing ? `${API_BASE_URL}/${encodeURIComponent(id)}` : API_BASE_URL;
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to ${isEditing ? 'update' : 'create'} product: ${
          res.status
        } ${text || ''}`.trim()
      );
    }

    formStatus.textContent = isEditing
      ? 'Product updated successfully.'
      : 'Product created successfully.';
    formStatus.classList.remove('error');
    formStatus.classList.add('success');

    resetForm();
    await fetchProducts();
  } catch (err) {
    console.error(err);
    formStatus.textContent = err.message || 'An error occurred.';
    formStatus.classList.add('error');
  } finally {
    saveButton.disabled = false;
    cancelEditButton.disabled = !isEditing;
  }
}

function resetForm() {
  productForm.reset();
  document.getElementById('productId').value = '';
  isEditing = false;
  formTitle.textContent = 'Add Product';
  saveButton.textContent = 'Save Product';
  cancelEditButton.disabled = true;
}

async function startEditProduct(id) {
  formStatus.textContent = '';

  try {
    const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(id)}`);
    if (!res.ok) {
      throw new Error(`Failed to load product details (status ${res.status}).`);
    }
    const product = await res.json();

    document.getElementById('productId').value = product.id;
    document.getElementById('name').value = product.name ?? '';
    document.getElementById('description').value = product.description ?? '';
    document.getElementById('price').value = product.price ?? '';
    document.getElementById('category').value = product.category ?? '';
    document.getElementById('stockCount').value = product.stockCount ?? '';

    isEditing = true;
    formTitle.textContent = 'Edit Product';
    saveButton.textContent = 'Update Product';
    cancelEditButton.disabled = false;

    productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error(err);
    formStatus.textContent = err.message || 'Unable to start editing.';
    formStatus.classList.add('error');
  }
}

async function deleteProduct(id) {
  const confirmed = window.confirm(
    'Are you sure you want to delete this product?'
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete product (status ${res.status}).`);
    }
    await fetchProducts();
  } catch (err) {
    console.error(err);
    alert(err.message || 'Unable to delete product.');
  }
}

async function viewProduct(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(id)}`);
    if (!res.ok) {
      throw new Error(`Failed to load product details (status ${res.status}).`);
    }
    const product = await res.json();
    const details = [
      `Name: ${product.name ?? ''}`,
      `Description: ${product.description ?? ''}`,
      `Category: ${product.category ?? ''}`,
      `Price: $${Number(product.price ?? 0).toFixed(2)}`,
      `Stock: ${Number(product.stockCount ?? 0)}`,
      `ID: ${product.id}`,
    ].join('\n');
    alert(details);
  } catch (err) {
    console.error(err);
    alert(err.message || 'Unable to load product details.');
  }
}

// Event listeners
filtersForm.addEventListener('submit', (event) => {
  event.preventDefault();
  fetchProducts();
});

resetFiltersButton.addEventListener('click', () => {
  filtersForm.reset();
  fetchProducts();
});

productForm.addEventListener('submit', handleSaveProduct);
cancelEditButton.addEventListener('click', resetForm);

productsBody.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  if (action === 'edit') {
    startEditProduct(id);
  } else if (action === 'delete') {
    deleteProduct(id);
  } else if (action === 'view') {
    viewProduct(id);
  }
});

// Initial load
fetchProducts();

