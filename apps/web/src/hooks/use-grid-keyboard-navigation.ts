/**
 * Grid Keyboard Navigation Hook
 *
 * Enables arrow key navigation between input cells in a grid/table layout.
 * Works with marks entry, timetable, and other tabular input forms.
 *
 * Features:
 * - Arrow keys (↑↓←→) to move between cells
 * - Tab to move right, Shift+Tab to move left
 * - Enter to move down to next row
 * - Home/End for first/last cell in row
 * - Ctrl+Home/End for first/last cell in table
 */

import { useCallback, useRef } from 'react';

interface GridPosition {
  row: number;
  col: number;
}

interface UseGridKeyboardNavigationOptions {
  /** Total number of rows in the grid */
  rows: number;
  /** Total number of columns in the grid */
  cols: number;
  /** CSS selector to find input elements (default: 'input, [role="textbox"]') */
  inputSelector?: string;
  /** Whether to wrap around when reaching edges */
  wrap?: boolean;
  /** Callback when position changes */
  onPositionChange?: (position: GridPosition) => void;
}

export function useGridKeyboardNavigation({
  rows,
  cols,
  inputSelector = 'input, [role="textbox"], [tabindex]',
  wrap = false,
  onPositionChange,
}: UseGridKeyboardNavigationOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Generate a unique cell ID for data attributes
   */
  const getCellId = useCallback((row: number, col: number) => {
    return `cell-${row}-${col}`;
  }, []);

  /**
   * Focus an element and select its text if it's an input
   */
  const focusAndSelect = (element: HTMLElement) => {
    element.focus();
    if ('select' in element && typeof element.select === 'function') {
      (element as HTMLInputElement).select();
    }
  };

  /**
   * Find and focus the input at the given position
   */
  const focusCell = useCallback(
    (row: number, col: number): boolean => {
      if (!containerRef.current) {
        return false;
      }

      const cell = containerRef.current.querySelector(
        `[data-row="${row}"][data-col="${col}"]`
      ) as HTMLElement;

      if (!cell) {
        return false;
      }

      // If it's an input, focus it directly; otherwise, find the input inside
      const isInput = cell.tagName === 'INPUT' || cell.tagName === 'TEXTAREA';
      const target = isInput ? cell : (cell.querySelector(inputSelector) as HTMLElement);

      if (target) {
        focusAndSelect(target);
      }

      onPositionChange?.({ row, col });
      return true;
    },
    [inputSelector, onPositionChange]
  );

  /**
   * Calculate the next position based on direction
   */
  const getNextPosition = useCallback(
    (
      currentRow: number,
      currentCol: number,
      direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end' | 'tableStart' | 'tableEnd'
    ): GridPosition | null => {
      switch (direction) {
        case 'up':
          return currentRow - 1 >= 0
            ? { row: currentRow - 1, col: currentCol }
            : wrap ? { row: rows - 1, col: currentCol } : null;
        case 'down':
          return currentRow + 1 < rows
            ? { row: currentRow + 1, col: currentCol }
            : wrap ? { row: 0, col: currentCol } : null;
        case 'left':
          if (currentCol - 1 >= 0) return { row: currentRow, col: currentCol - 1 };
          if (!wrap) return null;
          return currentRow > 0
            ? { row: currentRow - 1, col: cols - 1 }
            : { row: rows - 1, col: cols - 1 };
        case 'right':
          if (currentCol + 1 < cols) return { row: currentRow, col: currentCol + 1 };
          if (!wrap) return null;
          return currentRow < rows - 1 ? { row: currentRow + 1, col: 0 } : { row: 0, col: 0 };
        case 'home':
          return { row: currentRow, col: 0 };
        case 'end':
          return { row: currentRow, col: cols - 1 };
        case 'tableStart':
          return { row: 0, col: 0 };
        case 'tableEnd':
          return { row: rows - 1, col: cols - 1 };
      }
    },
    [rows, cols, wrap]
  );

  /**
   * Determine navigation direction from a keyboard event.
   * Returns null if the key should not trigger navigation.
   */
  const getDirectionFromKey = (
    e: React.KeyboardEvent<HTMLInputElement>
  ): 'up' | 'down' | 'left' | 'right' | 'home' | 'end' | 'tableStart' | 'tableEnd' | null => {
    const target = e.target as HTMLInputElement;

    switch (e.key) {
      case 'ArrowUp':
        return 'up';
      case 'ArrowDown':
      case 'Enter':
        return 'down';
      case 'ArrowLeft':
        if (target.tagName === 'INPUT' && target.selectionStart !== 0 && target.value.length > 0) {
          return null;
        }
        return 'left';
      case 'ArrowRight':
        if (target.tagName === 'INPUT' && target.selectionEnd !== target.value.length && target.value.length > 0) {
          return null;
        }
        return 'right';
      case 'Tab':
        return e.shiftKey ? 'left' : 'right';
      case 'Home':
        return e.ctrlKey ? 'tableStart' : 'home';
      case 'End':
        return e.ctrlKey ? 'tableEnd' : 'end';
      default:
        return null;
    }
  };

  /**
   * Handle keyboard events on input cells
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const target = e.target as HTMLElement;

      // Get current position from data attributes
      const rowAttr =
        target.dataset.row ?? target.closest('[data-row]')?.getAttribute('data-row');
      const colAttr =
        target.dataset.col ?? target.closest('[data-col]')?.getAttribute('data-col');

      if (rowAttr === null || rowAttr === undefined || colAttr === null || colAttr === undefined) {
        return;
      }

      const currentRow = parseInt(rowAttr, 10);
      const currentCol = parseInt(colAttr, 10);

      if (isNaN(currentRow) || isNaN(currentCol)) {
        return;
      }

      const direction = getDirectionFromKey(e);
      if (!direction) {
        return;
      }

      const nextPos = getNextPosition(currentRow, currentCol, direction);
      if (nextPos && focusCell(nextPos.row, nextPos.col)) {
        e.preventDefault();
      }
    },
    [getNextPosition, focusCell]
  );

  /**
   * Focus the first cell when needed
   */
  const focusFirstCell = useCallback(() => {
    focusCell(0, 0);
  }, [focusCell]);

  /**
   * Focus a specific cell
   */
  const focusCellAt = useCallback(
    (row: number, col: number) => {
      focusCell(row, col);
    },
    [focusCell]
  );

  return {
    /** Ref to attach to the container element */
    containerRef,
    /** Handler to attach to each input's onKeyDown */
    handleKeyDown,
    /** Generate cell ID for keys and data attributes */
    getCellId,
    /** Focus the first cell */
    focusFirstCell,
    /** Focus a specific cell */
    focusCellAt,
  };
}

export default useGridKeyboardNavigation;
