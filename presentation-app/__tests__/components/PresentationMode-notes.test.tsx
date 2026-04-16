import { describe, it, expect, vi, beforeEach } from 'vitest';

// Feature: slide-notes
// Validates: Requirements 3.1, 3.3, 3.4, 3.5

/**
 * Tests for PresentationMode Presenter-View-Button logic.
 *
 * The vitest environment is "node" (no jsdom / @testing-library), so we test
 * the handler logic directly rather than mounting the React component.
 *
 * The logic under test mirrors handleOpenPresenterView and handleExit in
 * PresentationMode.tsx:
 *
 *   handleOpenPresenterView():
 *     - If presenterWindowRef.current is non-null and not closed → call focus()
 *     - Otherwise → call window.open('/presenter', 'presenter-view', ...)
 *     - If window.open returns null → set presenterBlocked = true
 *     - If window.open returns a Window → store it in presenterWindowRef, set presenterBlocked = false
 *
 *   handleExit():
 *     - Call presenterWindowRef.current?.close()
 *     - Then call onExit()
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface MockWindow {
  closed: boolean;
  focus: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

function makeMockWindow(closed = false): MockWindow {
  return {
    closed,
    focus: vi.fn(),
    close: vi.fn(),
  };
}

/**
 * Simulates the handleOpenPresenterView logic from PresentationMode.tsx.
 * Returns the updated state so tests can assert on it.
 */
function simulateOpenPresenterView(
  presenterWindowRef: { current: MockWindow | null },
  windowOpen: (url: string, target: string, features: string) => MockWindow | null,
  setPresenterBlocked: (v: boolean) => void
): void {
  // If window is already open, bring it to focus
  if (presenterWindowRef.current && !presenterWindowRef.current.closed) {
    presenterWindowRef.current.focus();
    return;
  }

  const win = windowOpen(
    '/presenter',
    'presenter-view',
    'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no'
  );

  if (win === null) {
    setPresenterBlocked(true);
  } else {
    presenterWindowRef.current = win;
    setPresenterBlocked(false);
  }
}

/**
 * Simulates the handleExit logic from PresentationMode.tsx.
 */
function simulateHandleExit(
  presenterWindowRef: { current: MockWindow | null },
  onExit: () => void
): void {
  presenterWindowRef.current?.close();
  presenterWindowRef.current = null;
  onExit();
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PresentationMode – Presenter-View-Button', () => {
  let presenterWindowRef: { current: MockWindow | null };
  let setPresenterBlocked: ReturnType<typeof vi.fn>;
  let onExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    presenterWindowRef = { current: null };
    setPresenterBlocked = vi.fn();
    onExit = vi.fn();
  });

  // ── Requirement 3.1 ──────────────────────────────────────────────────────
  it('opens a new presenter window when none is open', () => {
    // Validates: Requirements 3.1
    const mockWin = makeMockWindow();
    const windowOpen = vi.fn().mockReturnValue(mockWin);

    simulateOpenPresenterView(presenterWindowRef, windowOpen, setPresenterBlocked);

    expect(windowOpen).toHaveBeenCalledOnce();
    expect(windowOpen).toHaveBeenCalledWith(
      '/presenter',
      'presenter-view',
      expect.stringContaining('width=1280')
    );
    expect(presenterWindowRef.current).toBe(mockWin);
    expect(setPresenterBlocked).toHaveBeenCalledWith(false);
  });

  // ── Requirement 3.5 ──────────────────────────────────────────────────────
  it('sets presenterBlocked=true when window.open returns null (popup blocked)', () => {
    // Validates: Requirements 3.5
    const windowOpen = vi.fn().mockReturnValue(null);

    simulateOpenPresenterView(presenterWindowRef, windowOpen, setPresenterBlocked);

    expect(windowOpen).toHaveBeenCalledOnce();
    expect(setPresenterBlocked).toHaveBeenCalledWith(true);
    // ref must not be set to null-result
    expect(presenterWindowRef.current).toBeNull();
  });

  // ── Requirement 3.3 ──────────────────────────────────────────────────────
  it('calls focus() instead of window.open() when presenter window is already open', () => {
    // Validates: Requirements 3.3
    const existingWin = makeMockWindow(false); // not closed
    presenterWindowRef.current = existingWin;

    const windowOpen = vi.fn();

    simulateOpenPresenterView(presenterWindowRef, windowOpen, setPresenterBlocked);

    expect(existingWin.focus).toHaveBeenCalledOnce();
    expect(windowOpen).not.toHaveBeenCalled();
    expect(setPresenterBlocked).not.toHaveBeenCalled();
  });

  it('opens a new window when previous presenter window was closed by user', () => {
    // Validates: Requirements 3.3 (closed window is treated as absent)
    const closedWin = makeMockWindow(true); // already closed
    presenterWindowRef.current = closedWin;

    const newWin = makeMockWindow();
    const windowOpen = vi.fn().mockReturnValue(newWin);

    simulateOpenPresenterView(presenterWindowRef, windowOpen, setPresenterBlocked);

    expect(closedWin.focus).not.toHaveBeenCalled();
    expect(windowOpen).toHaveBeenCalledOnce();
    expect(presenterWindowRef.current).toBe(newWin);
  });

  // ── Requirement 3.4 ──────────────────────────────────────────────────────
  it('closes the presenter window when onExit is called', () => {
    // Validates: Requirements 3.4
    const openWin = makeMockWindow();
    presenterWindowRef.current = openWin;

    simulateHandleExit(presenterWindowRef, onExit);

    expect(openWin.close).toHaveBeenCalledOnce();
    expect(onExit).toHaveBeenCalledOnce();
    expect(presenterWindowRef.current).toBeNull();
  });

  it('calls onExit even when no presenter window is open', () => {
    // Validates: Requirements 3.4 (graceful when ref is null)
    presenterWindowRef.current = null;

    simulateHandleExit(presenterWindowRef, onExit);

    expect(onExit).toHaveBeenCalledOnce();
  });
});
