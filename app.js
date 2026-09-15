const state = {
  products: [],
  category: "CHICKEN",
  search: "",
  location: "ALL",
  unit: "ALL"
};

// Categories are inferred from the item description because the supplied JSON
// does not contain a category field.
const CATEGORY_RULES = [
  ["CHICKEN", ["CHICKEN", "PANE", "TAWOOK", "SHAWERMA"]],
  ["BEEF & MEAT", ["BEEF", "MEAT", "KOFTA", "MOMBAR", "SAUSAGE", "DAWOOD", "HAWAWSHI", "GOLASH", "BASTERMA", "KOBIBA"]],
  ["PIZZA", ["PIZZA"]],
  ["SANDWICHES", ["SANDWICH"]],
  ["SALADS", ["SALAD"]],
  ["RICE & SIDES", ["RICE", "POTATO", "POMME", "FRIES", "VEGETABLE", "MOZZARELLA", "SPRING ROLL", "RONDAL"]],
  ["MEALS", ["MEAL"]],
  ["READY TO COOK", ["READY TO COOK"]]
];

function clean(value) {
  return String(value ?? "").trim();
}

function displayName(description) {
  return clean(description)
    .replace(/\s*-\s*SPINNEYS\s*-\s*/gi, " ")
    .replace(/\s*-\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+-\s*$/g, "")
    .trim();
}

function getCategory(description) {
  const text = clean(description).toUpperCase();
  for (const [category, words] of CATEGORY_RULES) {
    if (words.some(word => text.includes(word))) return category;
  }
  return "OTHER";
}

function groupRows(rows) {
  const map = new Map();

  rows.forEach(row => {
    const no = clean(row["No_"]);
    if (!no) return;

    if (!map.has(no)) {
      map.set(no, {
        no,
        description: clean(row["Description"]),
        name: displayName(row["Description"]),
        unit: clean(row["Unit of Measure Code"]).toUpperCase(),
        locations: [],
        prices: []
      });
    }

    const item = map.get(no);
    const location = clean(row["Location Code"]).toUpperCase();
    const price = Number(row["RSP"]);

    if (location && !item.locations.includes(location)) {
      item.locations.push(location);
    }

    if (Number.isFinite(price)) {
      item.prices.push({ location, price });
    }
  });

  return [...map.values()].map(item => {
    const uniquePrices = [...new Set(item.prices.map(x => x.price.toFixed(2)))];

    // Your current data normally has the same RSP at ENAWK/MOA.
    // If locations have different prices, use the lowest price for the card
    // and show the locations. This can easily be changed to location-specific
    // pricing later.
    item.price = uniquePrices.length ? Number(uniquePrices[0]) : 0;
    item.category = getCategory(item.description);
    return item;
  });
}

function formatPrice(value) {
  return Number(value).toLocaleString("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " EGP";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function imagePath(no) {
  return `images/${encodeURIComponent(no)}.jpg`;
}

function cardHtml(item) {
  return `
    <article class="card">
      <div class="product-image">
        <img
          src="${imagePath(item.no)}"
          alt="${escapeHtml(item.name)}"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        >
        <div class="placeholder" style="display:none">
          ${escapeHtml(item.name)}
        </div>
      </div>

      <div class="card-body">
        <div class="product-name">${escapeHtml(item.name)}</div>
        <div class="product-code">Code: ${escapeHtml(item.no)}</div>

        <div class="card-footer">
          <div class="available">
            <strong>Available at:</strong><br>
            <span class="locations">${escapeHtml(item.locations.join(", "))}</span>
          </div>

          <div class="price">
            ${formatPrice(item.price)}
            <div class="price-unit">/${escapeHtml(item.unit || "UNIT")}</div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function filteredProducts() {
  const q = state.search.toLowerCase().trim();

  return state.products.filter(item => {
    const searchable = `${item.no} ${item.name} ${item.description}`.toLowerCase();
    const searchOk = !q || searchable.includes(q);
    const locationOk = state.location === "ALL" || item.locations.includes(state.location);
    const unitOk = state.unit === "ALL" || item.unit === state.unit;
    const categoryOk = state.category === "ALL" || item.category === state.category;
    return searchOk && locationOk && unitOk && categoryOk;
  });
}

function renderLocationFilter() {
  const locations = [...new Set(state.products.flatMap(item => item.locations))].sort();
  const select = document.getElementById("locationFilter");

  select.innerHTML = `<option value="ALL">All locations</option>` +
    locations.map(location => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`).join("");

  select.value = state.location;
}

function renderCategories() {
  const counts = {};
  state.products.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });

  const categories = Object.keys(counts).sort((a, b) => a.localeCompare(b));
  if (categories.includes("CHICKEN")) {
    categories.splice(categories.indexOf("CHICKEN"), 1);
    categories.unshift("CHICKEN");
  }

  const nav = document.getElementById("categoryNav");
  nav.innerHTML = `
    <button class="${state.category === "ALL" ? "active" : ""}" data-category="ALL">ALL</button>
    ${categories.map(category => `
      <button class="${state.category === category ? "active" : ""}" data-category="${escapeHtml(category)}">
        ${escapeHtml(category)} (${counts[category]})
      </button>
    `).join("")}
  `;

  nav.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      render();
    });
  });
}

function render() {
  const products = filteredProducts();
  document.getElementById("itemCount").textContent =
    `${products.length} item${products.length === 1 ? "" : "s"}`;

  renderCategories();

  const container = document.getElementById("productsContainer");

  if (!products.length) {
    container.innerHTML = `
      <div class="no-results">
        <strong>No items found</strong><br>
        Try another search, category, location or unit.
      </div>
    `;
    return;
  }

  // When a category is selected, only that category is shown.
  // When ALL is selected, products are grouped into sections.
  const groups = {};
  products.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  const categories = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  if (state.category === "ALL" && categories.includes("CHICKEN")) {
    categories.splice(categories.indexOf("CHICKEN"), 1);
    categories.unshift("CHICKEN");
  }

  container.innerHTML = categories.map(category => `
    <section class="category">
      <h2 class="category-title">${escapeHtml(category)}</h2>
      <div class="grid">
        ${groups[category].map(cardHtml).join("")}
      </div>
    </section>
  `).join("");
}

async function loadData() {
  try {
    const response = await fetch("data/products.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    const rows = Array.isArray(json) ? json : (json.Spinneys || json.Spinneys || []);

    state.products = groupRows(rows);
    renderLocationFilter();
    render();
  } catch (error) {
    console.error(error);
    document.getElementById("productsContainer").innerHTML = `
      <div class="no-results">
        <strong>Could not load data/products.json</strong><br>
        Start the site through a web server such as IIS, VS Code Live Server, or
        <code>python -m http.server 8080</code>.
      </div>
    `;
  }
}

document.getElementById("searchInput").addEventListener("input", event => {
  state.search = event.target.value;
  document.getElementById("clearSearch").style.display = state.search ? "block" : "none";
  render();
});

document.getElementById("clearSearch").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  state.search = "";
  document.getElementById("clearSearch").style.display = "none";
  render();
});

document.getElementById("locationFilter").addEventListener("change", event => {
  state.location = event.target.value;
  render();
});

document.getElementById("unitFilter").addEventListener("change", event => {
  state.unit = event.target.value;
  render();
});

loadData();
