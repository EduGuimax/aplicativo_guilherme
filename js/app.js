import { CATEGORIES, LEARN_ACTIVITIES, EMOJI_GROUPS } from "./data.js";
import { speak } from "./tts.js";
import {
  getCustomCards,
  addCustomCard,
  removeCustomCard,
  getCustomCategories,
  addCustomCategory,
  removeCustomCategory,
  getHiddenCardIds,
  hideDefaultCard,
  getHiddenCategoryIds,
  hideDefaultCategory,
  getCustomActivities,
  addCustomActivity,
  removeCustomActivity,
  getCustomActivityItems,
  addCustomActivityItem,
  removeCustomActivityItem,
  getHiddenActivityIds,
  hideDefaultActivity,
  getHiddenActivityItemIds,
  hideDefaultActivityItem,
  getCategoryOrder,
  setCategoryOrder,
  getCardOrder,
  setCardOrder,
  restoreAllHidden,
  getSettings,
  setSettings,
} from "./storage.js";
import {
  renderCategoryTabs,
  renderCardGrid,
  renderActivityItems,
  renderActivityTiles,
  renderHomeExtraTiles,
  renderEmojiGroupTabs,
  renderEmojiPicker,
  renderSentenceWords,
  showSpotlight,
  hideSpotlight,
} from "./render.js";
import { enableDragReorder } from "./dragsort.js";

let activeCategoryId = CATEGORIES[0].id;
let activeActivityId = null;
let editMode = false;
let currentScreen = "home";

// Aplica uma ordem customizada (arrastada pela família) a uma lista de itens.
// Itens que ainda não foram reordenados (não estão em orderIds) vão para o fim,
// mantendo a ordem natural entre eles.
function applyOrder(items, orderIds) {
  if (!orderIds || orderIds.length === 0) return items;
  const index = new Map(orderIds.map((id, i) => [id, i]));
  return [...items].sort((a, b) => {
    const ai = index.has(a.id) ? index.get(a.id) : Infinity;
    const bi = index.has(b.id) ? index.get(b.id) : Infinity;
    return ai - bi;
  });
}

// ---------- Navegação entre telas ----------

function showScreen(id) {
  currentScreen = id;
  document.querySelectorAll(".screen").forEach((el) => {
    el.classList.toggle("screen--active", el.id === "screen-" + id);
  });
  hideSpotlight();
}

document.querySelectorAll("[data-nav]").forEach((el) => {
  el.addEventListener("click", () => {
    const target = el.getAttribute("data-nav");
    showScreen(target);
    if (target === "conversar") renderConversar();
    if (target === "aprender") renderAprender();
  });
});

document.getElementById("btn-home").addEventListener("click", () => {
  showScreen("home");
  renderHome();
});

function refreshCurrentScreen() {
  if (currentScreen === "conversar") renderConversar();
  else if (currentScreen === "aprender") renderAprender();
  else if (currentScreen === "activity") renderActivityScreen();
  else if (currentScreen === "home") renderHome();
}

// ---------- Modo de edição (excluir palavras/categorias/atividades) ----------

const btnEdit = document.getElementById("btn-edit");
const editBanner = document.getElementById("edit-banner");

btnEdit.addEventListener("click", () => {
  editMode = !editMode;
  btnEdit.classList.toggle("is-active", editMode);
  editBanner.classList.toggle("edit-banner--visible", editMode);
  refreshCurrentScreen();
});

// ---------- Início ----------

function homeActivities() {
  return getCustomActivities().filter((a) => a.pinned === "home");
}

function renderHome() {
  renderHomeExtraTiles(document.getElementById("home-extra-tiles"), homeActivities(), (activityId) => {
    openActivity(activityId);
  }, {
    onAdd: () => openAddActivityModal("home"),
    editMode,
    onDelete: (activityId) => confirmDeleteActivity(activityId),
  });
}

// ---------- Conversar ----------

function allCategories() {
  const hiddenIds = getHiddenCategoryIds();
  const defaults = CATEGORIES.filter((c) => !hiddenIds.includes(c.id));
  const combined = [...defaults, ...getCustomCategories()];
  return applyOrder(combined, getCategoryOrder());
}

function cardsForCategory(categoryId) {
  const defaultCat = CATEGORIES.find((c) => c.id === categoryId);
  const hiddenIds = getHiddenCardIds(categoryId);
  const base = defaultCat ? defaultCat.cards.filter((c) => !hiddenIds.includes(c.id)) : [];
  const custom = getCustomCards(categoryId).map((c) => ({ ...c, custom: true }));
  return applyOrder([...base, ...custom], getCardOrder(categoryId));
}

function renderConversar() {
  const cats = allCategories();
  if (!cats.find((c) => c.id === activeCategoryId)) {
    activeCategoryId = cats[0] ? cats[0].id : null;
  }

  renderCategoryTabs(document.getElementById("tabs"), cats, activeCategoryId, (id) => {
    activeCategoryId = id;
    renderConversar();
  }, {
    editMode,
    onDelete: (categoryId) => confirmDeleteCategory(categoryId),
    onAddCategory: () => openAddCategoryModal(),
  });

  if (!activeCategoryId) {
    document.getElementById("grid-conversar").innerHTML = "";
    return;
  }

  renderCardGrid(document.getElementById("grid-conversar"), cardsForCategory(activeCategoryId), (card) => {
    addToSentence(card);
  }, {
    onAdd: () => openAddModal(activeCategoryId),
    editMode,
    onDelete: (card) => confirmDeleteCard(activeCategoryId, card),
  });
}

function confirmDeleteCategory(categoryId) {
  const cats = allCategories();
  if (cats.length <= 1) return;
  const cat = cats.find((c) => c.id === categoryId);
  if (!cat) return;

  showConfirm({
    title: "Excluir categoria",
    message: `Excluir a categoria "${cat.label}" e todas as palavras dela?`,
    onConfirm: () => {
      if (categoryId.startsWith("cat-custom-")) {
        removeCustomCategory(categoryId);
      } else {
        hideDefaultCategory(categoryId);
      }
      if (activeCategoryId === categoryId) {
        activeCategoryId = null;
      }
      renderConversar();
    },
  });
}

function confirmDeleteCard(categoryId, card) {
  showConfirm({
    title: "Excluir palavra",
    message: `Excluir "${card.label}"?`,
    onConfirm: () => {
      if (card.custom) {
        removeCustomCard(categoryId, card.id);
      } else {
        hideDefaultCard(categoryId, card.id);
      }
      renderConversar();
    },
  });
}

// ---------- Barra de frase (Conversar) ----------
// Cada toque numa palavra fala ela na hora e soma na frase.
// Tocar em "Falar" lê a frase inteira, do jeito que foi montada.

let sentence = [];

function renderSentence() {
  renderSentenceWords(document.getElementById("sentence-words"), sentence, (index) => {
    sentence.splice(index, 1);
    renderSentence();
  });
  document.getElementById("sentence-bar").classList.toggle("sentence-bar--empty", sentence.length === 0);
}

function addToSentence(card) {
  speak(card.speak);
  sentence.push({ label: card.label, speak: card.speak, emoji: card.emoji });
  renderSentence();
}

document.getElementById("sentence-clear").addEventListener("click", () => {
  sentence = [];
  renderSentence();
});

document.getElementById("sentence-speak").addEventListener("click", () => {
  if (sentence.length === 0) return;
  speak(sentence.map((w) => w.speak).join(" "));
});

// ---------- Aprender (submenu de atividades) ----------

function aprenderActivities() {
  const hidden = getHiddenActivityIds();
  const defaults = LEARN_ACTIVITIES.filter((a) => !hidden.includes(a.id));
  const customs = getCustomActivities().filter((a) => a.pinned === "aprender");
  return [...defaults, ...customs];
}

function renderAprender() {
  renderActivityTiles(document.getElementById("aprender-grid"), aprenderActivities(), (activityId) => {
    openActivity(activityId);
  }, {
    onAdd: () => openAddActivityModal("aprender"),
    editMode,
    onDelete: (activityId) => confirmDeleteActivity(activityId),
  });
}

function findActivity(activityId) {
  return LEARN_ACTIVITIES.find((a) => a.id === activityId) || getCustomActivities().find((a) => a.id === activityId);
}

function confirmDeleteActivity(activityId) {
  const activity = findActivity(activityId);
  if (!activity) return;

  showConfirm({
    title: "Excluir atividade",
    message: `Excluir a atividade "${activity.label}" e tudo que tem nela?`,
    onConfirm: () => {
      if (activityId.startsWith("act-custom-")) {
        removeCustomActivity(activityId);
      } else {
        hideDefaultActivity(activityId);
      }
      renderHome();
      renderAprender();
      if (currentScreen === "activity" && activeActivityId === activityId) {
        showScreen("aprender");
        renderAprender();
      }
    },
  });
}

// ---------- Atividade (Cores / Letras / Números / customizadas) ----------

function itemsForActivity(activity) {
  const hiddenIds = getHiddenActivityItemIds(activity.id);
  const base = (activity.items || []).filter((i) => !hiddenIds.includes(i.id));
  const custom = getCustomActivityItems(activity.id).map((i) => ({ ...i, custom: true }));
  return [...base, ...custom];
}

function openActivity(activityId) {
  activeActivityId = activityId;
  showScreen("activity");
  renderActivityScreen();
}

function handleActivityItemTap(activity, item) {
  if (item.custom) {
    speak(item.speak || item.label);
    showSpotlight({ emoji: item.emoji || "⭐", title: item.label });
    return;
  }

  if (activity.display === "color") {
    speak(item.label);
    showSpotlight({ emoji: "⬤", title: item.label });
    document.getElementById("spotlight-emoji").style.color = item.hex;
  } else if (activity.display === "letter") {
    speak(item.label);
    showSpotlight({ emoji: item.emoji, title: item.label, subtitle: item.word });
    setTimeout(() => speak(item.label + " de " + item.word), 500);
  } else if (activity.display === "number") {
    speak(item.label);
    showSpotlight({ emoji: item.dots || "🔢", title: item.label });
  } else {
    speak(item.speak || item.label);
    showSpotlight({ emoji: item.emoji || "⭐", title: item.label });
  }
}

function renderActivityScreen() {
  const activity = findActivity(activeActivityId);
  if (!activity) {
    showScreen("aprender");
    renderAprender();
    return;
  }

  document.getElementById("activity-title").textContent = `${activity.emoji} ${activity.label}`;

  renderActivityItems(document.getElementById("grid-activity"), itemsForActivity(activity), activity.display, (item) => {
    handleActivityItemTap(activity, item);
  }, {
    onAdd: () => openAddItemModal(activity.id),
    editMode,
    onDelete: (item) => confirmDeleteActivityItem(activity.id, item),
  });
}

function confirmDeleteActivityItem(activityId, item) {
  showConfirm({
    title: "Excluir item",
    message: `Excluir "${item.label}"?`,
    onConfirm: () => {
      if (item.custom) {
        removeCustomActivityItem(activityId, item.id);
      } else {
        hideDefaultActivityItem(activityId, item.id);
      }
      renderActivityScreen();
    },
  });
}

document.getElementById("spotlight").addEventListener("click", hideSpotlight);

// ---------- Modal: adicionar palavra / item ----------
// Reaproveitado tanto para cartões do Conversar quanto para itens de uma atividade.

const modalAdd = document.getElementById("modal-add");
let addTarget = null; // { type: "card", categoryId } | { type: "activityItem", activityId }
let selectedWordEmoji = "⭐";

function openAddModal(categoryId) {
  addTarget = { type: "card", categoryId };
  selectedWordEmoji = "⭐";
  document.getElementById("add-label").value = "";
  document.getElementById("add-emoji-preview").textContent = selectedWordEmoji;
  modalAdd.classList.add("modal--visible");
}

function openAddItemModal(activityId) {
  addTarget = { type: "activityItem", activityId };
  selectedWordEmoji = "⭐";
  document.getElementById("add-label").value = "";
  document.getElementById("add-emoji-preview").textContent = selectedWordEmoji;
  modalAdd.classList.add("modal--visible");
}

function closeAddModal() {
  modalAdd.classList.remove("modal--visible");
}

document.getElementById("add-cancel").addEventListener("click", closeAddModal);

document.getElementById("add-emoji-trigger").addEventListener("click", () => {
  openEmojiPicker(activeCategoryId === "pessoas" ? "pessoas" : null, (emoji) => {
    selectedWordEmoji = emoji;
    document.getElementById("add-emoji-preview").textContent = emoji;
  });
});

document.getElementById("add-save").addEventListener("click", () => {
  const label = document.getElementById("add-label").value.trim();
  if (!label || !addTarget) {
    closeAddModal();
    return;
  }

  if (addTarget.type === "card") {
    addCustomCard(addTarget.categoryId, { label, speak: label, emoji: selectedWordEmoji });
    closeAddModal();
    renderConversar();
  } else {
    addCustomActivityItem(addTarget.activityId, { label, speak: label, emoji: selectedWordEmoji });
    closeAddModal();
    renderActivityScreen();
  }
});

// ---------- Modal: adicionar categoria / atividade (página) ----------
// Reaproveitado para: categoria do Conversar, atividade do Aprender, atividade da Início.

const modalAddCategory = document.getElementById("modal-add-category");
let catTarget = null; // { type: "category" } | { type: "activity", pinned }
let selectedCategoryEmoji = "⭐";

function openAddCategoryModal() {
  catTarget = { type: "category" };
  selectedCategoryEmoji = "⭐";
  document.getElementById("cat-modal-title").textContent = "Nova categoria";
  document.getElementById("cat-field-label").textContent = "Nome da categoria";
  document.getElementById("cat-label").value = "";
  document.getElementById("cat-emoji-preview").textContent = selectedCategoryEmoji;
  modalAddCategory.classList.add("modal--visible");
}

function openAddActivityModal(pinned) {
  catTarget = { type: "activity", pinned };
  selectedCategoryEmoji = "⭐";
  document.getElementById("cat-modal-title").textContent = "Nova atividade";
  document.getElementById("cat-field-label").textContent = "Nome da atividade";
  document.getElementById("cat-label").value = "";
  document.getElementById("cat-emoji-preview").textContent = selectedCategoryEmoji;
  modalAddCategory.classList.add("modal--visible");
}

function closeAddCategoryModal() {
  modalAddCategory.classList.remove("modal--visible");
}

document.getElementById("cat-cancel").addEventListener("click", closeAddCategoryModal);

document.getElementById("cat-emoji-trigger").addEventListener("click", () => {
  openEmojiPicker(null, (emoji) => {
    selectedCategoryEmoji = emoji;
    document.getElementById("cat-emoji-preview").textContent = emoji;
  });
});

document.getElementById("cat-save").addEventListener("click", () => {
  const label = document.getElementById("cat-label").value.trim();
  if (!label || !catTarget) {
    closeAddCategoryModal();
    return;
  }

  if (catTarget.type === "category") {
    const category = addCustomCategory({ label, emoji: selectedCategoryEmoji });
    activeCategoryId = category.id;
    closeAddCategoryModal();
    renderConversar();
  } else {
    const activity = addCustomActivity({ label, emoji: selectedCategoryEmoji, pinned: catTarget.pinned });
    closeAddCategoryModal();
    renderHome();
    renderAprender();
    openActivity(activity.id);
  }
});

// ---------- Modal: seletor de emoji ----------

const modalEmoji = document.getElementById("modal-emoji");
let activeEmojiGroupId = EMOJI_GROUPS[0].id;
let emojiPickerCallback = null;

function renderEmojiGroupTabsUI() {
  renderEmojiGroupTabs(document.getElementById("emoji-group-tabs"), EMOJI_GROUPS, activeEmojiGroupId, (id) => {
    activeEmojiGroupId = id;
    renderEmojiGroupTabsUI();
    renderEmojiGridUI();
  });
}

function renderEmojiGridUI() {
  const group = EMOJI_GROUPS.find((g) => g.id === activeEmojiGroupId) || EMOJI_GROUPS[0];
  renderEmojiPicker(document.getElementById("emoji-grid"), group.emojis, (emoji) => {
    if (emojiPickerCallback) emojiPickerCallback(emoji);
    modalEmoji.classList.remove("modal--visible");
  });
}

function openEmojiPicker(preferredGroupId, onPick) {
  activeEmojiGroupId = preferredGroupId || EMOJI_GROUPS[0].id;
  emojiPickerCallback = onPick;
  renderEmojiGroupTabsUI();
  renderEmojiGridUI();
  modalEmoji.classList.add("modal--visible");
}

document.getElementById("emoji-cancel").addEventListener("click", () => {
  modalEmoji.classList.remove("modal--visible");
});

// ---------- Modal: confirmar exclusão ----------

const modalConfirm = document.getElementById("modal-confirm");
let confirmAction = null;

function showConfirm({ title, message, onConfirm }) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-message").textContent = message;
  confirmAction = onConfirm;
  modalConfirm.classList.add("modal--visible");
}

function closeConfirm() {
  modalConfirm.classList.remove("modal--visible");
  confirmAction = null;
}

document.getElementById("confirm-cancel").addEventListener("click", closeConfirm);

document.getElementById("confirm-ok").addEventListener("click", () => {
  const action = confirmAction;
  closeConfirm();
  if (action) action();
});

// ---------- Modal: ajustes de voz ----------

const modalSettings = document.getElementById("modal-settings");
const rateRange = document.getElementById("rate-range");

document.getElementById("btn-settings").addEventListener("click", () => {
  rateRange.value = getSettings().rate;
  modalSettings.classList.add("modal--visible");
});

document.getElementById("settings-close").addEventListener("click", () => {
  modalSettings.classList.remove("modal--visible");
});

rateRange.addEventListener("input", () => {
  setSettings({ rate: parseFloat(rateRange.value) });
});

document.getElementById("rate-test").addEventListener("click", () => {
  speak("Olá! Esta é a minha voz.");
});

document.getElementById("restore-hidden").addEventListener("click", () => {
  restoreAllHidden();
  refreshCurrentScreen();
});

// ---------- Arrastar para reordenar (abas e cartões do Conversar) ----------
// Só funciona com o modo de edição (✏️) ligado, pra não interferir no uso normal.

enableDragReorder(document.getElementById("tabs"), () => editMode, (orderedIds) => {
  setCategoryOrder(orderedIds);
});

enableDragReorder(document.getElementById("grid-conversar"), () => editMode, (orderedIds) => {
  setCardOrder(activeCategoryId, orderedIds);
});

// ---------- Inicialização ----------

renderHome();
renderSentence();

// ---------- Service worker (funcionamento offline) ----------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.warn("Falha ao registrar service worker:", err);
    });
  });
}
