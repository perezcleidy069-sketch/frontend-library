const configuredApiBase = document.querySelector('meta[name="api-base"]')?.content.trim();
const apiBase = (configuredApiBase || 'http://localhost:3000/api/v1').replace(/\/+$/, '');
const coverPalettes = [
  'linear-gradient(145deg,#94533f,#4a2d37)',
  'linear-gradient(145deg,#315c63,#182e3d)',
  'linear-gradient(145deg,#6e663c,#393527)',
  'linear-gradient(145deg,#5d5077,#30283d)',
  'linear-gradient(145deg,#4c7057,#273a34)',
  'linear-gradient(145deg,#885d42,#49372e)',
];

const state = {
  books: [],
  authors: [],
  categories: [],
  editorials: [],
  filter: 'all',
  category: '',
  query: '',
  sort: 'recent',
};

const elements = {
  bookGrid: document.querySelector('#book-grid'),
  categoryFilter: document.querySelector('#category-filter'),
  categoryList: document.querySelector('#category-list'),
  connectionLabel: document.querySelector('#connection-label'),
  errorMessage: document.querySelector('#error-message'),
  errorPanel: document.querySelector('#error-panel'),
  emptyState: document.querySelector('#empty-state'),
  resultsLabel: document.querySelector('#results-label'),
  searchInput: document.querySelector('#search-input'),
  sortSelect: document.querySelector('#sort-select'),
  statusDot: document.querySelector('#status-dot'),
  totalCount: document.querySelector('#total-count'),
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function fetchResource(resource) {
  const response = await fetch(`${apiBase}/${resource}?limit=100`);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Error HTTP ${response.status}`);
  }
  return normalizeList(payload);
}

async function checkApi() {
  const response = await fetch(`${apiBase}/health`);
  if (!response.ok) throw new Error(`Estado de API HTTP ${response.status}`);
}

function getNameById(items, id, fields = ['id', 'id_author', 'id_category', 'id_editorial']) {
  const item = items.find((entry) => fields.some((field) => String(entry[field]) === String(id)));
  return item?.name || '';
}

function bookDetails(book) {
  const author = book.author || book.author_name || getNameById(state.authors, book.id_author);
  const category = book.category || book.category_name || getNameById(state.categories, book.id_category);
  const editorial = book.editorial || book.editorial_name || getNameById(state.editorials, book.id_editorial);
  return { author: author || 'Autor no especificado', category: category || 'Lecturas', editorial: editorial || 'Editorial no especificada' };
}

function filteredBooks() {
  const query = state.query.toLocaleLowerCase('es');
  const books = state.books.filter((book) => {
    const details = bookDetails(book);
    const matchesText = !query || [book.name, details.author, details.editorial, details.category]
      .some((value) => String(value).toLocaleLowerCase('es').includes(query));
    const matchesCategory = !state.category || String(book.id_category) === state.category
      || details.category === state.category;
    const stock = Number(book.stock || 0);
    const matchesAvailability = state.filter === 'all'
      || (state.filter === 'available' && stock > 0)
      || (state.filter === 'unavailable' && stock <= 0);
    return matchesText && matchesCategory && matchesAvailability;
  });

  return books.sort((first, second) => {
    if (state.sort === 'title') return String(first.name).localeCompare(String(second.name), 'es');
    if (state.sort === 'stock') return Number(second.stock || 0) - Number(first.stock || 0);
    return Number(second.year_publish || 0) - Number(first.year_publish || 0);
  });
}

function renderBooks() {
  const books = filteredBooks();
  elements.totalCount.textContent = String(state.books.length);
  elements.resultsLabel.textContent = `${books.length} ${books.length === 1 ? 'libro' : 'libros'}`;
  elements.bookGrid.setAttribute('aria-busy', 'false');
  elements.emptyState.hidden = books.length > 0;
  elements.bookGrid.innerHTML = books.map((book, index) => {
    const details = bookDetails(book);
    const stock = Math.max(0, Number(book.stock || 0));
    const palette = coverPalettes[index % coverPalettes.length];
    return `
      <article class="book-card">
        <div class="book-cover" style="--cover-bg:${palette}">
          <span class="stock-badge${stock ? '' : ' is-empty'}">${stock ? `${stock} disponibles` : 'Agotado'}</span>
          <div class="cover-inner">
            <span class="cover-category">${escapeHtml(details.category)}</span>
            <span class="cover-book-title">${escapeHtml(book.name || 'Libro sin título')}</span>
            <span class="cover-bottom"></span>
          </div>
        </div>
        <div class="book-info">
          <p class="book-category">${escapeHtml(details.category)}</p>
          <h3 class="book-title">${escapeHtml(book.name || 'Libro sin título')}</h3>
          <p class="book-author">${escapeHtml(details.author)}</p>
          <div class="book-meta">
            <span>${escapeHtml(details.editorial)}</span>
            <strong>${escapeHtml(book.year_publish || '—')}</strong>
          </div>
        </div>
      </article>`;
  }).join('');
}

function renderCategories() {
  const counts = new Map();
  for (const book of state.books) {
    const details = bookDetails(book);
    const key = String(book.id_category ?? details.category);
    const current = counts.get(key) || { name: details.category, count: 0 };
    current.count += 1;
    counts.set(key, current);
  }
  const categories = state.categories.length
    ? state.categories.map((category) => ({
      id: category.id ?? category.id_category,
      name: category.name,
      count: counts.get(String(category.id ?? category.id_category))?.count || 0,
    }))
    : [...counts.entries()].map(([id, value]) => ({ id, ...value }));

  elements.categoryFilter.innerHTML = '<option value="">Todas las categorías</option>'
    + categories.map((category) => `<option value="${escapeHtml(category.id ?? category.name)}">${escapeHtml(category.name)}</option>`).join('');
  elements.categoryList.innerHTML = categories.length
    ? categories.map((category) => `
      <button class="category-card" type="button" data-category="${escapeHtml(category.id ?? category.name)}">
        <strong>${escapeHtml(category.name)}</strong>
        <span class="category-count">${category.count} ${category.count === 1 ? 'libro' : 'libros'} <span aria-hidden="true">↗</span></span>
      </button>`).join('')
    : '<p class="category-placeholder">Aún no hay categorías en el catálogo.</p>';
}

async function loadCatalog() {
  elements.errorPanel.hidden = true;
  elements.bookGrid.setAttribute('aria-busy', 'true');
  elements.bookGrid.innerHTML = '<div class="loading-card"><span class="loader"></span><span>Cargando libros…</span></div>';
  elements.emptyState.hidden = true;
  elements.statusDot.className = 'status-dot';
  elements.connectionLabel.textContent = 'Conectando API';

  try {
    const [books, authors, categories, editorials] = await Promise.all([
      fetchResource('books'),
      fetchResource('authors'),
      fetchResource('categories'),
      fetchResource('editorials'),
      checkApi(),
    ]);
    state.books = books;
    state.authors = authors;
    state.categories = categories;
    state.editorials = editorials;
    elements.statusDot.classList.add('is-online');
    elements.connectionLabel.textContent = 'API conectada';
    renderCategories();
    renderBooks();
  } catch (error) {
    state.books = [];
    elements.statusDot.classList.add('is-offline');
    elements.connectionLabel.textContent = 'API desconectada';
    elements.errorMessage.textContent = `${error.message}. Comprueba que la API esté activa en ${apiBase}.`;
    elements.errorPanel.hidden = false;
    elements.bookGrid.innerHTML = '';
    elements.bookGrid.setAttribute('aria-busy', 'false');
    elements.totalCount.textContent = '0';
    elements.resultsLabel.textContent = 'No disponible';
    console.error('No se pudo cargar el catálogo de Campus Library:', error);
  }
}

document.querySelector('#search-form').addEventListener('submit', (event) => event.preventDefault());
elements.searchInput.addEventListener('input', () => {
  state.query = elements.searchInput.value.trim();
  renderBooks();
});
elements.categoryFilter.addEventListener('change', () => {
  state.category = elements.categoryFilter.value;
  renderBooks();
});
elements.sortSelect.addEventListener('change', () => {
  state.sort = elements.sortSelect.value;
  renderBooks();
});
document.querySelectorAll('.filter-tab').forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document.querySelector('.filter-tab.is-active')?.classList.remove('is-active');
    button.classList.add('is-active');
    renderBooks();
  });
});
document.querySelectorAll('.nav-link').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.nav-link.is-active')?.classList.remove('is-active');
    button.classList.add('is-active');
    const view = button.dataset.view;
    if (view === 'categorias') {
      document.querySelector('#category-section').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    state.filter = view === 'disponibles' ? 'available' : 'all';
    document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.filter === state.filter));
    document.querySelector('#catalog-title').textContent = view === 'disponibles' ? 'Libros disponibles' : 'Explora la colección.';
    document.querySelector('#catalog-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
    renderBooks();
  });
});
elements.categoryList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  state.category = button.dataset.category;
  elements.categoryFilter.value = state.category;
  document.querySelector('#catalog-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
  renderBooks();
});
document.querySelector('#retry-button').addEventListener('click', loadCatalog);
document.querySelector('#clear-filters').addEventListener('click', () => {
  state.query = '';
  state.category = '';
  state.filter = 'all';
  elements.searchInput.value = '';
  elements.categoryFilter.value = '';
  document.querySelector('#catalog-title').textContent = 'Explora la colección.';
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('is-active', link.dataset.view === 'explorar'));
  document.querySelectorAll('.filter-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.filter === 'all'));
  renderBooks();
});

document.querySelector('.api-link').href = `${apiBase.replace(/\/api\/v1$/, '')}/api-docs`;
loadCatalog();
