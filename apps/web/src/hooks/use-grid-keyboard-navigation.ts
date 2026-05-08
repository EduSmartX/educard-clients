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

/**
 * Hook to enable keyboard navigation in a grid of inputs
 * 
 * @example
 * ```tsx
 * const { containerRef, handleKeyDown, getCellId } = useGridKeyboardNavigation({
 *   rows: students.length,
 *   cols: subjects.length,
 * });
 * 
 * return (
 *   <div ref={containerRef}>
 *     {students.map((student, rowIndex) => (
 *       subjects.map((subject, colIndex) => (
 *         <input
 *           key={getCellId(rowIndex, colIndex)}
 *           data-row={rowIndex}
 *           data-col={colIndex}
 *           onKeyDown={handleKeyDown}
 *         />
 *       ))
 *     ))}
 *   </div>
 * );
 * ```
 */
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
   * Find and focus the input at the given position
   */
  const focusCell = useCallback((row: number, col: number): boolean => {
    if (!containerRef.current) {
      return false;
    }
    
    // Try to find by data attributes first (most reliable)
    const cell = containerRef.current.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    ) as HTMLElement;
    
    if (cell) {
      // If it's an input, focus it directly
      if (cell.tagName === 'INPUT' || cell.tagName === 'TEXTAREA') {
        cell.focus();
        // Select all text for easy replacement
        if ('select' in cell && typeof cell.select === 'function') {
          (cell as HTMLInputElement).select();
        }
      } else {
        // Otherwise, find the input inside
        const input = cell.querySelector(inputSelector) as HTMLElement;
        if (input) {
          input.focus();
          if ('select' in input && typeof input.select === 'function') {
            (input as HTMLInputElement).select();
          }
        }
      }
      
      onPositionChange?.({ row, col });
      return true;
    }
    
    return false;
  }, [inputSelector, onPositionChange]);

  /**
   * Calculate the next position based on direction
   */
  const getNextPosition = useCallback((
    currentRow: number,
    currentCol: number,
    direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end' | 'tableStart' | 'tableEnd'
  ): GridPosition | null => {
    let nextRow = currentRow;
    let nextCol = currentCol;

    switch (direction) {
      case 'up':
        nextRow = currentRow - 1;
        if (nextRow < 0) {
          if (wrap) {
            nextRow = rows - 1;
          } else {
            return null;
          }
        }
        break;
      case 'down':
        nextRow = currentRow + 1;
        if (nextRow >= rows) {
          if (wrap) {
            nextRow = 0;
          } else {
            return null;
          }
        }
        break;
      case 'left':
        nextCol = currentCol - 1;
        if (nextCol < 0) {
          if (wrap && currentRow > 0) {
            nextCol = cols - 1;
            nextRow = currentRow - 1;
          } else if (wrap) {
            nextCol = cols - 1;
            nextRow = rows - 1;
          } else {
            return null;
          }
        }
        break;
      case 'right':
        nextCol = currentCol + 1;
        if (nextCol >= cols) {
          if (wrap && currentRow < rows - 1) {
            nextCol = 0;
            nextRow = currentRow + 1;
          } else if (wrap) {
            nextCol = 0;
            nextRow = 0;
          } else {
            return null;
          }
        }
        break;
      case 'home':
        nextCol = 0;
        break;
      case 'end':
        nextCol = cols - 1;
        break;
      case 'tableStart':
        nextRow = 0;
        nextCol = 0;
        break;
      case 'tableEnd':
        nextRow = rows - 1;
        nextCol = cols - 1;
        break;
    }

    return { row: nextRow, col: nextCol };
  }, [rows, cols, wrap]);

  /**
   * Handle keyboard events on input cells
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLElement;
    
    // Get current position from data attributes
    const rowAttr = target.getAttribute('data-row') ?? target.closest('[data-row]')?.getAttribute('data-row');
    const colAttr = target.getAttribute('data-col') ?? target.closest('[data-col]')?.getAttribute('data-col');
    
    if (rowAttr === null || rowAttr === undefined || colAttr === null || colAttr === undefined) {
      return;
    }
    
    const currentRow = parseInt(rowAttr, 10);
    const currentCol = parseInt(colAttr, 10);
    
    if (isNaN(currentRow) || isNaN(currentCol)) {
      return;
    }

    let direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end' | 'tableStart' | 'tableEnd' | null = null;

    switch (e.key) {
      case 'ArrowUp':
        direction = 'up';
        break;
      case 'ArrowDown':
      case 'Enter':
        direction = 'down';
        break;
      case 'ArrowLeft':
        // Only navigate if at the start of input or input is empty
        if (target.tagName === 'INPUT') {
          const input = target as HTMLInputElement;
          if (input.selectionStart !== 0 && input.value.length > 0) {
            return; // Let default cursor movement happen
          }
        }
        direction = 'left';
        break;
      case 'ArrowRight':
        // Only navigate if at the end of input or input is empty
        if (target.tagName === 'INPUT') {
          const input = target as HTMLInputElement;
          if (input.selectionEnd !== input.value.length && input.value.length > 0) {
            return; // Let default cursor movement happen
          }
        }
        direction = 'right';
        break;
      case 'Tab':
        // Use Tab for navigation
        direction = e.shiftKey ? 'left' : 'right';
        break;
      case 'Home':
        direction = e.ctrlKey ? 'tableStart' : 'home';
        break;
      case 'End':
        direction = e.ctrlKey ? 'tableEnd' : 'end';
        break;
      default:
        return; // Don't prevent default for other keys
    }

    if (direction) {
      const nextPos = getNextPosition(currentRow, currentCol, direction);
      if (nextPos && focusCell(nextPos.row, nextPos.col)) {
        e.preventDefault();
      }
    }
  }, [getNextPosition, focusCell]);

  /**
   * Focus the first cell when needed
   */
  const focusFirstCell = useCallback(() => {
    focusCell(0, 0);
  }, [focusCell]);

  /**
   * Focus a specific cell
   */
  const focusCellAt = useCallback((row: number, col: number) => {
    focusCell(row, col);
  }, [focusCell]);

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
