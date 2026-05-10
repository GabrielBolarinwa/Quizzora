export function trapFocus(modal: HTMLElement): void {
  const focusable = modal.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  first.focus();

  modal.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

export function decode(str: string): string {
  return (
    new DOMParser().parseFromString(str, "text/html").body.textContent ?? str
  );
}
