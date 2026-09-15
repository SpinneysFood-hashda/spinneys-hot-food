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

// Curated free-to-use fallback images. Local images always have priority.
// These are only fallbacks; the site also searches Wikimedia Commons for a
// more relevant image when a local image is missing.
const CATEGORY_FALLBACKS = {
  "CHICKEN": {
    url: "https://images.unsplash.com/photo-1762631383520-df106b252f6a?auto=format&fit=crop&fm=jpg&q=80&w=1200",
    source: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/sliced-grilled-chicken-breast-with-rice-and-salad-3f4KbOE9M1w"
  },
  "BEEF & MEAT": {
    url: "https://images.pexels.com/photos/27612514/pexels-photo-27612514/free-photo-of-a-green-salad-with-chicken-and-vegetables-on-a-plate.jpeg?auto=compress&dpr=1&h=750&w=1260",
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/a-green-salad-with-chicken-and-vegetables-on-a-plate-27612514/"
  },
  "PIZZA": {
    url: "https://images.pexels.com/photos/27819676/pexels-photo-27819676/free-photo-of-a-table-with-a-pizza-salad-and-other-food.jpeg?auto=compress&dpr=1&h=750&w=1260",
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/a-table-with-a-pizza-salad-and-other-food-27819676/"
  },
  "SANDWICHES": {
    url: "https://images.pexels.com/photos/23370999/pexels-photo-23370999/free-photo-of-chicken-with-roll-and-salad.jpeg?auto=compress&dpr=1&h=750&w=1260",
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/chicken-with-roll-and-salad-23370999/"
  },
  "SALADS": {
    url: "https://images.pexels.com/photos/18281697/pexels-photo-18281697/free-photo-of-salad-in-bowl.jpeg?auto=compress&dpr=1&h=750&w=1260",
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/salad-in-bowl-18281697/"
  },
  "RICE & SIDES": {
    url: "https://images.unsplash.com/photo-1768179669433-bd9d52949c20?auto=format&fit=crop&fm=jpg&q=80&w=1200",
    source: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/chicken-curry-with-rice-and-salad-ncXvQnrmStA"
  },
  "MEALS": {
    url: "https://images.unsplash.com/photo-1768179669433-bd9d52949c20?auto=format&fit=crop&fm=jpg&q=80&w=1200",
    source: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/chicken-curry-with-rice-and-salad-ncXvQnrmStA"
  },
  "READY TO COOK": {
    url: "https://images.unsplash.com/photo-1781332144017-776ef66c3ab9?auto=format&fit=crop&fm=jpg&q=80&w=1200",
    source: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/grilled-chicken-with-salad-lime-and-dipping-sauce-JvdvggDe-yA"
  },
  "OTHER": {
    url: "https://images.unsplash.com/photo-1762631383520-df106b252f6a?auto=format&fit=crop&fm=jpg&q=80&w=1200",
    source: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/sliced-grilled-chicken-breast-with-rice-and-salad-3f4KbOE9M1w"
  }
};

const IMAGE_CACHE_KEY = "spinneysHotFoodImageCacheV1";
const imageCache = loadImageCache();
const imageSearchInProgress = new Set();

function loadImageCache() {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || "{}");
  } catch (_) {
    return {};
  }
}

function saveImageCache() {
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(imageCache));
  } catch (_) {
    // Ignore storage restrictions/private browsing.
  }
}

function clean(value) {
  return String(value ?? "").trim();
}

function displayName(description) {
  return clean(description)
    .replace(/\s*-\s*SPINNEYS\s*-\s*/gi, " ")
    .replace(/\s*-\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+-\s*$/, "")
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

function fallbackFor(item) {
  return CATEGORY_FALLBACKS[item.category] || CATEGORY_FALLBACKS.OTHER;
}

function cleanImageSearchText(item) {
  return item.name
    .replace(/\b(KG|EACH|PCS|PACK|TRAY|BOX)\b/gi, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function imageCreditHtml(source, sourceUrl) {
  if (!source || !sourceUrl) return "";
  return `<a class="image-credit" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source)}</a>`;
}

function cardHtml(item) {
  const fallback = fallbackFor(item);
  return `
    <article class="card">
      <div class="product-image">
        <img
          class="product-photo"
          src="${imagePath(item.no)}"
          alt="${escapeHtml(item.name)}"
          loading="lazy"
          data-no="${escapeHtml(item.no)}"
          data-category="${escapeHtml(item.category)}"
          data-name="${escapeHtml(item.name)}"
          data-local-failed="0"
          onload="handleLocalImageLoaded(this)"
          onerror="handleLocalImageError(this)"
        >
        <div class="placeholder" style="display:none">
          ${escapeHtml(item.name)}
        </div>
        <div class="image-source"></div>
        <noscript>
          <img src="${escapeHtml(fallback.url)}" alt="${escapeHtml(item.name)}">
        </noscript>
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

function setImage(img, result) {
  const credit = img.parentElement.querySelector(".image-source");
  img.dataset.stage = result.stage || "online";
  img.src = result.url;
  img.style.display = "block";
  if (credit) credit.innerHTML = imageCreditHtml(result.source, result.sourceUrl);

  const placeholder = img.nextElementSibling;
  if (placeholder && placeholder.classList.contains("placeholder")) {
    placeholder.style.display = "none";
  }
}

function handleLocalImageLoaded(img) {
  // Do not search the internet when the product has its own image.
  if (img.dataset.stage !== "fallback" && img.dataset.stage !== "online") {
    img.dataset.stage = "local";
    const credit = img.parentElement.querySelector(".image-source");
    if (credit) credit.innerHTML = "";
  }
}

function handleLocalImageError(img) {
  // If a remote fallback/search image also fails, show the clean placeholder.
  if (img.dataset.stage === "fallback" || img.dataset.stage === "online") {
    img.style.display = "none";
    const placeholder = img.nextElementSibling;
    if (placeholder && placeholder.classList.contains("placeholder")) {
      placeholder.style.display = "flex";
    }
    return;
  }

  if (img.dataset.localFailed === "1") return;

  img.dataset.localFailed = "1";
  img.dataset.stage = "fallback";

  const item = state.products.find(product => product.no === img.dataset.no);
  if (!item) return;

  const fallback = fallbackFor(item);
  setImage(img, {
    url: fallback.url,
    source: fallback.source,
    sourceUrl: fallback.sourceUrl,
    stage: "fallback"
  });
}

async function searchWikimediaImage(item) {
  const query = cleanImageSearchText(item);
  if (!query) return null;

  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", `${query} food`);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "5");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|extmetadata");
  url.searchParams.set("iiurlwidth", "900");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Wikimedia HTTP ${response.status}`);

  const json = await response.json();
  const pages = Object.values(json.query?.pages || {});

  const preferredWords = query.toLowerCase().split(/\s+/).filter(word => word.length >= 4);

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info || !/^image\//i.test(info.mime || "")) continue;

    const title = clean(page.title).toLowerCase();
    const score = preferredWords.reduce((sum, word) => sum + (title.includes(word) ? 1 : 0), 0);

    // Avoid obvious logos/icons/maps/documents where possible.
    if (/logo|icon|map|flag|diagram|poster|chart|menu\.svg/i.test(title)) continue;
    if (preferredWords.length >= 2 && score === 0) continue;

    return {
      url: info.thumburl || info.url,
      source: "Wikimedia Commons",
      sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/^File:/i, ""))}`,
      stage: "online"
    };
  }

  return null;
}

async function resolveOnlineImage(img) {
  if (img.dataset.localFailed !== "1") return;

  const no = img.dataset.no;
  if (!no || imageSearchInProgress.has(no)) return;

  if (Object.prototype.hasOwnProperty.call(imageCache, no)) {
    const cached = imageCache[no];
    if (cached) setImage(img, { ...cached, stage: "online" });
    return;
  }

  const item = state.products.find(product => product.no === no);
  if (!item) return;

  imageSearchInProgress.add(no);
  try {
    const result = await searchWikimediaImage(item);
    imageCache[no] = result || null;
    saveImageCache();
    if (result) setImage(img, result);
  } catch (error) {
    console.warn("Online image search failed:", item.name, error);
    // Keep the category fallback. The site still works if Wikimedia is blocked.
    imageCache[no] = null;
    saveImageCache();
  } finally {
    imageSearchInProgress.delete(no);
  }
}

function setupImageSearchObserver() {
  const images = document.querySelectorAll(".product-photo");
  if (!images.length) return;

  if (!("IntersectionObserver" in window)) {
    images.forEach(img => {
      if (img.dataset.localFailed === "1") resolveOnlineImage(img);
    });
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (entry.target.dataset.localFailed === "1") {
        resolveOnlineImage(entry.target);
      }
    });
  }, { rootMargin: "500px 0px" });

  images.forEach(img => observer.observe(img));
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

  // Start searching online only for images that are actually visible/nearby.
  // This prevents hundreds or thousands of API calls when the JSON is large.
  setTimeout(setupImageSearchObserver, 0);
}

async function loadData() {
  try {
    const response = await fetch("data/products.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    const rows = Array.isArray(json) ? json : (json.Spinneys || []);

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
