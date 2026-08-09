// Persistência local (localStorage): cartões e categorias customizadas pela família,
// itens padrão ocultos (excluídos) e preferências de voz.

const CARDS_KEY = "vamosConversar.customCards";
const CATEGORIES_KEY = "vamosConversar.customCategories";
const HIDDEN_CARDS_KEY = "vamosConversar.hiddenCards";
const HIDDEN_CATEGORIES_KEY = "vamosConversar.hiddenCategories";
const ACTIVITIES_KEY = "vamosConversar.customActivities";
const ACTIVITY_ITEMS_KEY = "vamosConversar.customActivityItems";
const HIDDEN_ACTIVITIES_KEY = "vamosConversar.hiddenActivities";
const HIDDEN_ACTIVITY_ITEMS_KEY = "vamosConversar.hiddenActivityItems";
const CATEGORY_ORDER_KEY = "vamosConversar.categoryOrder";
const CARD_ORDER_KEY = "vamosConversar.cardOrder";
const SETTINGS_KEY = "vamosConversar.settings";

const DEFAULT_SETTINGS = { rate: 0.9, pitch: 1.0 };

// Cores usadas para categorias novas, em rodízio.
const CATEGORY_COLORS = [
  "#26a69a", "#ec407a", "#7e57c2", "#ffa726", "#5c6bc0",
  "#26c6da", "#9ccc65", "#ff7043", "#8d6e63", "#42a5f5",
];

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn("Falha ao ler", key, err);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Falha ao salvar", key, err);
  }
}

// ---------- Cartões customizados ----------

// Retorna { [categoriaId]: [cartao, ...] }
export function getAllCustomCards() {
  return readJSON(CARDS_KEY, {});
}

export function getCustomCards(categoryId) {
  const all = getAllCustomCards();
  return all[categoryId] || [];
}

export function addCustomCard(categoryId, { label, speak, emoji }) {
  const all = getAllCustomCards();
  const list = all[categoryId] || [];
  const card = {
    id: "custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    label: label.trim(),
    speak: (speak || label).trim(),
    emoji: emoji || "⭐",
  };
  all[categoryId] = [...list, card];
  writeJSON(CARDS_KEY, all);
  return card;
}

export function removeCustomCard(categoryId, cardId) {
  const all = getAllCustomCards();
  const list = all[categoryId] || [];
  all[categoryId] = list.filter((c) => c.id !== cardId);
  writeJSON(CARDS_KEY, all);
}

// ---------- Categorias (páginas) customizadas ----------

export function getCustomCategories() {
  return readJSON(CATEGORIES_KEY, []);
}

export function addCustomCategory({ label, emoji }) {
  const list = getCustomCategories();
  const totalExisting = list.length;
  const category = {
    id: "cat-custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    label: label.trim(),
    emoji: emoji || "⭐",
    color: CATEGORY_COLORS[totalExisting % CATEGORY_COLORS.length],
    cards: [],
  };
  writeJSON(CATEGORIES_KEY, [...list, category]);
  return category;
}

export function removeCustomCategory(categoryId) {
  const list = getCustomCategories();
  writeJSON(CATEGORIES_KEY, list.filter((c) => c.id !== categoryId));

  const allCards = getAllCustomCards();
  delete allCards[categoryId];
  writeJSON(CARDS_KEY, allCards);
}

// ---------- Itens padrão ocultos (excluídos pela família) ----------

export function getHiddenCardIds(categoryId) {
  const all = readJSON(HIDDEN_CARDS_KEY, {});
  return all[categoryId] || [];
}

export function hideDefaultCard(categoryId, cardId) {
  const all = readJSON(HIDDEN_CARDS_KEY, {});
  const list = all[categoryId] || [];
  if (!list.includes(cardId)) {
    all[categoryId] = [...list, cardId];
    writeJSON(HIDDEN_CARDS_KEY, all);
  }
}

export function getHiddenCategoryIds() {
  return readJSON(HIDDEN_CATEGORIES_KEY, []);
}

export function hideDefaultCategory(categoryId) {
  const list = getHiddenCategoryIds();
  if (!list.includes(categoryId)) {
    writeJSON(HIDDEN_CATEGORIES_KEY, [...list, categoryId]);
  }
}

// ---------- Atividades do "Aprender" / Início (páginas customizadas) ----------

// pinned: "aprender" (aparece dentro do Aprender) ou "home" (aparece direto na tela inicial)
export function getCustomActivities() {
  return readJSON(ACTIVITIES_KEY, []);
}

export function addCustomActivity({ label, emoji, pinned }) {
  const list = getCustomActivities();
  const activity = {
    id: "act-custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    label: label.trim(),
    emoji: emoji || "⭐",
    color: CATEGORY_COLORS[list.length % CATEGORY_COLORS.length],
    pinned: pinned === "home" ? "home" : "aprender",
  };
  writeJSON(ACTIVITIES_KEY, [...list, activity]);
  return activity;
}

export function removeCustomActivity(activityId) {
  writeJSON(ACTIVITIES_KEY, getCustomActivities().filter((a) => a.id !== activityId));

  const allItems = readJSON(ACTIVITY_ITEMS_KEY, {});
  delete allItems[activityId];
  writeJSON(ACTIVITY_ITEMS_KEY, allItems);
}

export function getCustomActivityItems(activityId) {
  const all = readJSON(ACTIVITY_ITEMS_KEY, {});
  return all[activityId] || [];
}

export function addCustomActivityItem(activityId, { label, speak, emoji }) {
  const all = readJSON(ACTIVITY_ITEMS_KEY, {});
  const list = all[activityId] || [];
  const item = {
    id: "item-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    label: label.trim(),
    speak: (speak || label).trim(),
    emoji: emoji || "⭐",
  };
  all[activityId] = [...list, item];
  writeJSON(ACTIVITY_ITEMS_KEY, all);
  return item;
}

export function removeCustomActivityItem(activityId, itemId) {
  const all = readJSON(ACTIVITY_ITEMS_KEY, {});
  all[activityId] = (all[activityId] || []).filter((i) => i.id !== itemId);
  writeJSON(ACTIVITY_ITEMS_KEY, all);
}

export function getHiddenActivityIds() {
  return readJSON(HIDDEN_ACTIVITIES_KEY, []);
}

export function hideDefaultActivity(activityId) {
  const list = getHiddenActivityIds();
  if (!list.includes(activityId)) {
    writeJSON(HIDDEN_ACTIVITIES_KEY, [...list, activityId]);
  }
}

export function getHiddenActivityItemIds(activityId) {
  const all = readJSON(HIDDEN_ACTIVITY_ITEMS_KEY, {});
  return all[activityId] || [];
}

export function hideDefaultActivityItem(activityId, itemId) {
  const all = readJSON(HIDDEN_ACTIVITY_ITEMS_KEY, {});
  const list = all[activityId] || [];
  if (!list.includes(itemId)) {
    all[activityId] = [...list, itemId];
    writeJSON(HIDDEN_ACTIVITY_ITEMS_KEY, all);
  }
}

// Traz de volta tudo que foi excluído (palavras, categorias, atividades e itens padrão)
// (não afeta o que foi criado pela família, isso é apagado de vez).
export function restoreAllHidden() {
  writeJSON(HIDDEN_CARDS_KEY, {});
  writeJSON(HIDDEN_CATEGORIES_KEY, []);
  writeJSON(HIDDEN_ACTIVITIES_KEY, []);
  writeJSON(HIDDEN_ACTIVITY_ITEMS_KEY, {});
}

// ---------- Ordem escolhida pela família (arrastar para reordenar) ----------

// Ordem das abas de categoria no Conversar (lista de ids). Itens novos que ainda
// não foram reordenados aparecem no fim, na ordem natural.
export function getCategoryOrder() {
  return readJSON(CATEGORY_ORDER_KEY, []);
}

export function setCategoryOrder(orderedIds) {
  writeJSON(CATEGORY_ORDER_KEY, orderedIds);
}

// Ordem dos cartões dentro de uma categoria específica.
export function getCardOrder(categoryId) {
  const all = readJSON(CARD_ORDER_KEY, {});
  return all[categoryId] || [];
}

export function setCardOrder(categoryId, orderedIds) {
  const all = readJSON(CARD_ORDER_KEY, {});
  all[categoryId] = orderedIds;
  writeJSON(CARD_ORDER_KEY, all);
}

// ---------- Preferências de voz ----------

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...readJSON(SETTINGS_KEY, {}) };
}

export function setSettings(partial) {
  const merged = { ...getSettings(), ...partial };
  writeJSON(SETTINGS_KEY, merged);
  return merged;
}
