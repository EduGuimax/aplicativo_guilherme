// Permite arrastar os itens de um grid/lista para reordená-los (toque e arraste).
// Só funciona quando isEnabledFn() retorna true (ex: modo de edição ligado) —
// fora disso, os toques normais (falar a palavra, trocar de categoria) continuam
// funcionando exatamente como antes, sem nenhuma interferência.

const DRAG_THRESHOLD = 10; // px de movimento antes de considerar que é um arraste, não um toque

// container: elemento pai cujos filhos diretos com [data-id] podem ser reordenados
//            (o botão "+ Adicionar"/"+ Nova" não tem data-id, então nunca é movido)
// isEnabledFn: () => boolean — chamado a cada toque, decide se o arraste está ativo agora
// onReorder: (idsEmOrdem) => void — chamado ao soltar, com a nova ordem final dos ids
export function enableDragReorder(container, isEnabledFn, onReorder) {
  let dragEl = null;
  let startX = 0;
  let startY = 0;
  let dragging = false;

  function getSortableItems() {
    return Array.from(container.children).filter((el) => el.dataset && el.dataset.id);
  }

  function onPointerMove(e) {
    if (!dragEl) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      dragging = true;
      dragEl.classList.add("dragging");
    }

    e.preventDefault();

    const siblings = getSortableItems().filter((el) => el !== dragEl);
    for (const sib of siblings) {
      const rect = sib.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        continue;
      }
      const dragRect = dragEl.getBoundingClientRect();
      const comesBefore = dragRect.top < rect.top || (dragRect.top === rect.top && dragRect.left < rect.left);
      container.insertBefore(dragEl, comesBefore ? sib.nextSibling : sib);
      break;
    }
  }

  function onPointerUp() {
    if (!dragEl) return;
    dragEl.classList.remove("dragging");
    dragEl.removeEventListener("pointermove", onPointerMove);
    dragEl.removeEventListener("pointerup", onPointerUp);
    dragEl.removeEventListener("pointercancel", onPointerUp);

    if (dragging) {
      onReorder(getSortableItems().map((el) => el.dataset.id));
    }

    dragEl = null;
    dragging = false;
  }

  container.addEventListener("pointerdown", (e) => {
    if (!isEnabledFn()) return;
    const item = e.target.closest("[data-id]");
    if (!item || item.parentElement !== container) return;
    if (e.target.closest(".delete-badge")) return;

    dragEl = item;
    startX = e.clientX;
    startY = e.clientY;
    dragging = false;

    try {
      item.setPointerCapture(e.pointerId);
    } catch (err) {
      // Sem ponteiro ativo pra capturar (pode acontecer em alguns navegadores/emulações) —
      // sem problema, o arraste continua funcionando só com os eventos normais.
    }
    item.addEventListener("pointermove", onPointerMove);
    item.addEventListener("pointerup", onPointerUp);
    item.addEventListener("pointercancel", onPointerUp);
  });
}
