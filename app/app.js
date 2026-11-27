// Bargain Beacon: a working deal finder. Deals live in deals.js, so the
// site needs no network to show them; each deal links out to its store.
//
// Routes (hash):
//   #/            the list, with search, filters and sorting
//   #/deal/<id>  one deal, with every field and its evidence
//
// Query params set the starting filters (used by the screenshot views):
//   ?cat=<category>  ?store=<store>  ?q=<search term>  ?sort=<sort key>
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals, CHECKED } from "./deals.js";

const app = document.getElementById("app");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const storeSelect = document.getElementById("store");
const discountSelect = document.getElementById("discount");
const sortSelect = document.getElementById("sort");
const countLine = document.getElementById("count");
const bestList = document.getElementById("best-list");
const dealList = document.getElementById("deal-list");
const bestSection = document.getElementById("best");
const allSection = document.getElementById("all");
const detailBox = document.getElementById("detail");

export function discountOf(deal) {
  return Math.round(((deal.was - deal.price) / deal.was) * 100);
}

export function savingOf(deal) {
  return deal.was - deal.price;
}

function money(amount) {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, "");
}

function verdictLabel(verdict) {
  if (verdict === "new low") return "NEW LOW";
  if (verdict === "strong price") return "STRONG PRICE";
  return "ROUTINE SALE";
}

function verdictClass(verdict) {
  if (verdict === "new low") return "new-low";
  if (verdict === "strong price") return "strong";
  return "routine";
}

function checkedLabel(checked) {
  const date = new Date(checked);
  return date.toUTCString().slice(0, 22) + " UTC";
}

function cardHtml(deal) {
  return (
    '<article class="card">' +
    '<h3><a href="#/deal/' + deal.id + '">' + deal.title + "</a></h3>" +
    '<p class="meta">' + deal.store + " &middot; " + deal.category + "</p>" +
    '<p class="prices"><span class="sale">' + money(deal.price) + '</span>' +
    '<span class="was">' + money(deal.was) + '</span>' +
    '<span class="badge">-' + discountOf(deal) + "%</span></p>" +
    '<p class="save">You save ' + money(savingOf(deal)) + "</p>" +
    '<span class="verdict ' + verdictClass(deal.verdict) + '">' + verdictLabel(deal.verdict) + "</span>" +
    "<p class=\"evidence\">" + deal.evidence + "</p>" +
    '<p class="checked">Checked ' + checkedLabel(deal.checked) + " &middot; " + deal.source + "</p>" +
    '<a class="store-link" href="' + deal.url + '" target="_blank" rel="noopener">See it at ' + deal.store + " &rarr;</a>" +
    "</article>"
  );
}

function fillSelect(select, values, allLabel) {
  select.innerHTML = '<option value="">' + allLabel + "</option>" +
    values.map((value) => '<option value="' + value + '">' + value + "</option>").join("");
}

function readState() {
  return {
    q: searchInput.value.trim().toLowerCase(),
    category: categorySelect.value,
    store: storeSelect.value,
    minDiscount: Number(discountSelect.value),
    sort: sortSelect.value,
  };
}

function applyFilters(list, state) {
  return list.filter((deal) => {
    if (state.q && !deal.title.toLowerCase().includes(state.q) && !deal.store.toLowerCase().includes(state.q)) return false;
    if (state.category && deal.category !== state.category) return false;
    if (state.store && deal.store !== state.store) return false;
    if (discountOf(deal) < state.minDiscount) return false;
    return true;
  });
}

function applySort(list, sort) {
  const sorted = list.slice();
  if (sort === "discount") sorted.sort((a, b) => discountOf(b) - discountOf(a) || savingOf(b) - savingOf(a));
  if (sort === "saving") sorted.sort((a, b) => savingOf(b) - savingOf(a));
  if (sort === "price") sorted.sort((a, b) => a.price - b.price);
  return sorted;
}

function renderList() {
  const state = readState();
  const filtered = applyFilters(deals, state);
  const sorted = applySort(filtered, state.sort);
  const best = applySort(filtered, "discount").slice(0, 6);
  bestList.innerHTML = best.map(cardHtml).join("");
  dealList.innerHTML = sorted.length
    ? sorted.map(cardHtml).join("")
    : '<p class="empty">No deals match those filters. Clear the search or pick another category.</p>';
  countLine.textContent = "Showing " + sorted.length + " of " + deals.length + " deals" +
    (state.q ? ' for "' + searchInput.value.trim() + '"' : "") +
    (state.category ? " in " + state.category : "") +
    (state.store ? " at " + state.store : "") +
    (state.minDiscount ? " at " + state.minDiscount + "% off or more" : "") + ".";
  detailBox.hidden = true;
  bestSection.hidden = false;
  allSection.hidden = false;
  countLine.hidden = false;
  document.title = "Bargain Beacon: Black Friday 2026 deals, checked today";
}

function renderDetail(id) {
  const deal = deals.find((item) => item.id === id);
  bestSection.hidden = true;
  allSection.hidden = true;
  countLine.hidden = true;
  if (!deal) {
    detailBox.hidden = false;
    detailBox.innerHTML = "<h2>Deal not found</h2><p>That deal is not on the board. <a href=\"#/\">Back to all deals</a>.</p>";
    document.title = "Deal not found | Bargain Beacon";
    return;
  }
  detailBox.hidden = false;
  detailBox.innerHTML =
    "<h2>" + deal.title + "</h2>" +
    "<dl>" +
    "<dt>Store</dt><dd>" + deal.store + "</dd>" +
    "<dt>Category</dt><dd>" + deal.category + "</dd>" +
    "<dt>Sale price</dt><dd><strong>" + money(deal.price) + "</strong></dd>" +
    "<dt>Usual price</dt><dd>" + money(deal.was) + "</dd>" +
    "<dt>Discount</dt><dd>-" + discountOf(deal) + "% (you save " + money(savingOf(deal)) + ")</dd>" +
    "<dt>Verdict</dt><dd>" + verdictLabel(deal.verdict) + ": " + deal.evidence + "</dd>" +
    "<dt>Checked</dt><dd>" + checkedLabel(deal.checked) + "</dd>" +
    "<dt>Source</dt><dd>" + deal.source + "</dd>" +
    "</dl>" +
    '<p><a class="store-link" href="' + deal.url + '" target="_blank" rel="noopener">See it at ' + deal.store + " &rarr;</a></p>" +
    '<p><a href="#/">Back to all deals</a></p>';
  document.title = deal.title + " | Bargain Beacon";
}

function render() {
  window.__shotReady = false;
  const match = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (match) {
    renderDetail(decodeURIComponent(match[1]));
  } else {
    renderList();
  }
  window.__shotReady = true;
}

function startFromQuery() {
  const params = new URLSearchParams(location.search);
  const q = params.get("q");
  const cat = params.get("cat");
  const store = params.get("store");
  const sort = params.get("sort");
  if (q) searchInput.value = q;
  if (cat && [...categorySelect.options].some((option) => option.value === cat)) categorySelect.value = cat;
  if (store && [...storeSelect.options].some((option) => option.value === store)) storeSelect.value = store;
  if (sort && [...sortSelect.options].some((option) => option.value === sort)) sortSelect.value = sort;
}

const categories = [...new Set(deals.map((deal) => deal.category))].sort();
const stores = [...new Set(deals.map((deal) => deal.store))].sort();
fillSelect(categorySelect, categories, "All categories");
fillSelect(storeSelect, stores, "All stores");
startFromQuery();

for (const control of [searchInput, categorySelect, storeSelect, discountSelect, sortSelect]) {
  control.addEventListener("input", renderList);
  control.addEventListener("change", renderList);
}
window.addEventListener("hashchange", render);

render();
