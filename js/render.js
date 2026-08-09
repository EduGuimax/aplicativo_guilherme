// Funções que constroem os grids/cartões na tela a partir dos dados.
// Mantém o app.js focado em navegação; aqui só montamos DOM.

function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function pulse(el) {
  el.classList.remove("card--pulse");
  // força reflow para poder reiniciar a animação em toques repetidos
  void el.offsetWidth;
  el.classList.add("card--pulse");
}

// Cria um <span> com texto seguro (nunca HTML) — usado para qualquer texto que
// venha de um campo digitado pela família (nome de palavra/categoria/atividade),
// evitando que HTML/script digitado ali seja interpretado pelo navegador.
function spanEl(className, text) {
  const span = document.createElement("span");
  if (className) span.className = className;
  span.textContent = text;
  return span;
}

function addDeleteBadge(hostEl, onDelete) {
  hostEl.classList.add("has-delete");
  const badge = document.createElement("span");
  badge.className = "delete-badge";
  badge.textContent = "✕";
  badge.setAttribute("role", "button");
  badge.setAttribute("aria-label", "Excluir");
  badge.addEventListener("click", (e) => {
    e.stopPropagation();
    onDelete();
  });
  hostEl.appendChild(badge);
}

// options: { editMode, onDelete(categoryId), onAddCategory }
export function renderCategoryTabs(container, categories, activeId, onSelect, options = {}) {
  clear(container);
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "tab" + (cat.id === activeId ? " tab--active" : "");
    btn.style.setProperty("--tab-color", cat.color);
    btn.appendChild(spanEl("tab__emoji", cat.emoji));
    btn.appendChild(spanEl("tab__label", cat.label));
    btn.addEventListener("click", () => onSelect(cat.id));

    if (options.editMode && options.onDelete) {
      addDeleteBadge(btn, () => options.onDelete(cat.id));
    }

    container.appendChild(btn);
  });

  if (options.onAddCategory) {
    const addBtn = document.createElement("button");
    addBtn.className = "tab tab--add";
    addBtn.appendChild(spanEl("tab__emoji", "➕"));
    addBtn.appendChild(spanEl("tab__label", "Nova"));
    addBtn.addEventListener("click", options.onAddCategory);
    container.appendChild(addBtn);
  }
}

// cards: lista de {id, label, speak, emoji, custom?}
// options: { onAdd, editMode, onDelete(card) }
export function renderCardGrid(container, cards, onTap, options = {}) {
  clear(container);

  cards.forEach((card) => {
    const btn = document.createElement("button");
    btn.className = "card";
    btn.appendChild(spanEl("card__emoji", card.emoji));
    btn.appendChild(spanEl("card__label", card.label));
    btn.addEventListener("click", () => {
      pulse(btn);
      onTap(card);
    });

    if (options.editMode && options.onDelete) {
      addDeleteBadge(btn, () => options.onDelete(card));
    }

    container.appendChild(btn);
  });

  if (options.onAdd) {
    const addBtn = document.createElement("button");
    addBtn.className = "card card--add";
    addBtn.appendChild(spanEl("card__emoji", "➕"));
    addBtn.appendChild(spanEl("card__label", "Adicionar"));
    addBtn.addEventListener("click", options.onAdd);
    container.appendChild(addBtn);
  }
}

// Cria o botão de um item de atividade, com a aparência certa pro "display".
// Itens customizados (item.custom) sempre usam o estilo simples de cartão com emoji,
// mesmo dentro de uma atividade de outro tipo (ex: uma cor extra adicionada em Cores).
function createActivityItemButton(item, display) {
  const effectiveDisplay = item.custom ? "emoji" : display;
  const btn = document.createElement("button");

  if (effectiveDisplay === "color") {
    btn.className = "swatch";
    btn.style.background = item.hex;
    btn.style.color = item.text;
    btn.textContent = item.label;
  } else if (effectiveDisplay === "letter" || effectiveDisplay === "number") {
    btn.className = "letter-tile";
    btn.appendChild(spanEl("letter-tile__letter", item.label));
  } else {
    btn.className = "card";
    btn.appendChild(spanEl("card__emoji", item.emoji || "⭐"));
    btn.appendChild(spanEl("card__label", item.label));
  }
  return btn;
}

// items: lista de itens da atividade (cores, letras, números ou cartões customizados)
// options: { onAdd, editMode, onDelete(item) }
export function renderActivityItems(container, items, display, onTap, options = {}) {
  clear(container);

  items.forEach((item) => {
    const btn = createActivityItemButton(item, display);
    btn.addEventListener("click", () => {
      pulse(btn);
      onTap(item);
    });

    if (options.editMode && options.onDelete) {
      addDeleteBadge(btn, () => options.onDelete(item));
    }

    container.appendChild(btn);
  });

  if (options.onAdd) {
    const addBtn = document.createElement("button");
    addBtn.className = "card card--add";
    addBtn.appendChild(spanEl("card__emoji", "➕"));
    addBtn.appendChild(spanEl("card__label", "Adicionar"));
    addBtn.addEventListener("click", options.onAdd);
    container.appendChild(addBtn);
  }
}

// Ladrilhos grandes do submenu "Aprender" (uma atividade = uma ladrilho).
// options: { onAdd, editMode, onDelete(activityId) }
export function renderActivityTiles(container, activities, onTap, options = {}) {
  clear(container);

  activities.forEach((activity) => {
    const btn = document.createElement("button");
    btn.className = "learn-card" + (activity.cssClass ? " " + activity.cssClass : "");
    if (!activity.cssClass) {
      btn.style.background = `linear-gradient(160deg, ${activity.color}, ${activity.color})`;
    }
    btn.appendChild(spanEl("learn-card__emoji", activity.emoji));
    btn.appendChild(spanEl(null, activity.label));
    btn.addEventListener("click", () => onTap(activity.id));

    if (options.editMode && options.onDelete) {
      addDeleteBadge(btn, () => options.onDelete(activity.id));
    }

    container.appendChild(btn);
  });

  if (options.onAdd) {
    const addBtn = document.createElement("button");
    addBtn.className = "learn-card learn-card--add";
    addBtn.appendChild(spanEl("learn-card__emoji", "➕"));
    addBtn.appendChild(spanEl(null, "Nova atividade"));
    addBtn.addEventListener("click", options.onAdd);
    container.appendChild(addBtn);
  }
}

// Ladrilhos extras da tela inicial (atividades fixadas na Home pela família).
// options: { onAdd, editMode, onDelete(activityId) }
export function renderHomeExtraTiles(container, activities, onTap, options = {}) {
  clear(container);

  activities.forEach((activity) => {
    const btn = document.createElement("button");
    btn.className = "home-btn home-btn--extra";
    btn.style.background = `linear-gradient(160deg, ${activity.color}, ${activity.color})`;
    btn.appendChild(spanEl("home-btn__emoji", activity.emoji));
    btn.appendChild(spanEl(null, activity.label));
    btn.addEventListener("click", () => onTap(activity.id));

    if (options.editMode && options.onDelete) {
      addDeleteBadge(btn, () => options.onDelete(activity.id));
    }

    container.appendChild(btn);
  });

  if (options.onAdd) {
    const addBtn = document.createElement("button");
    addBtn.className = "home-btn home-btn--add";
    addBtn.appendChild(spanEl("home-btn__emoji", "➕"));
    addBtn.appendChild(spanEl(null, "Nova atividade"));
    addBtn.addEventListener("click", options.onAdd);
    container.appendChild(addBtn);
  }
}

// Overlay em tela cheia usado no "Aprender" para reforço visual forte:
// mostra emoji + texto grande no centro, some ao tocar em qualquer lugar.
export function showSpotlight({ emoji, title, subtitle }) {
  const overlay = document.getElementById("spotlight");
  const emojiEl = document.getElementById("spotlight-emoji");
  const titleEl = document.getElementById("spotlight-title");
  const subtitleEl = document.getElementById("spotlight-subtitle");

  emojiEl.textContent = emoji || "";
  emojiEl.style.color = "";
  titleEl.textContent = title || "";
  subtitleEl.textContent = subtitle || "";
  subtitleEl.style.display = subtitle ? "block" : "none";

  overlay.classList.add("spotlight--visible");
}

export function hideSpotlight() {
  document.getElementById("spotlight").classList.remove("spotlight--visible");
}

// ---------- Seletor de emoji ----------

export function renderEmojiGroupTabs(container, groups, activeId, onSelect) {
  clear(container);
  groups.forEach((group) => {
    const btn = document.createElement("button");
    btn.className = "tab tab--small" + (group.id === activeId ? " tab--active" : "");
    btn.style.setProperty("--tab-color", "#3d8bfd");
    btn.appendChild(spanEl("tab__emoji", group.icon));
    btn.appendChild(spanEl("tab__label", group.label));
    btn.addEventListener("click", () => onSelect(group.id));
    container.appendChild(btn);
  });
}

export function renderEmojiPicker(container, emojis, onPick) {
  clear(container);
  emojis.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "emoji-option";
    btn.textContent = emoji;
    btn.addEventListener("click", () => onPick(emoji));
    container.appendChild(btn);
  });
}
