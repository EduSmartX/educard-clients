/**
 * Marks Service - Shared Business Logic
 *
 * Contains calculation and transformation logic for marks management.
 * Used by both Web and Mobile applications.
 */

export interface MarkEntry {
  marks_obtained: number | string;
  is_absent: boolean;
  max_marks: number;
}

export interface SubjectStats {
  total: number;
  entered: number;
  absent: number;
  pending: number;
  sum: number;
  average: number;
  highest: number;
  lowest: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
}

export interface StudentTotal {
  total: number;
  maxTotal: number;
  percentage: number;
  subjectsAttempted: number;
  absent: number;
  grade?: string;
}

/**
 * Marks service with calculation utilities
 */
export const marksService = {
  /**
   * Parse marks value to number or 'AB' for absent
   */
  parseMarksValue(value: string | number | undefined): number | "AB" | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    if (typeof value === "string") {
      const upper = value.toUpperCase().trim();
      if (upper === "AB" || upper === "A") {
        return "AB";
      }
      const num = Number.parseFloat(value);
      return Number.isNaN(num) ? null : num;
    }
    return value;
  },

  /**
   * Format marks for display
   */
  formatMarksForDisplay(marks: number | "AB" | null): string {
    if (marks === null || marks === undefined) {
      return "—";
    }
    if (marks === "AB") {
      return "AB";
    }
    return marks.toString();
  },

  /**
   * Validate marks value against max marks
   */
  validateMarks(
    value: string | number,
    maxMarks: number,
  ): { valid: boolean; error?: string } {
    const parsed = this.parseMarksValue(value);

    if (parsed === null) {
      return { valid: true }; // Empty is valid
    }

    if (parsed === "AB") {
      return { valid: true }; // Absent is valid
    }

    if (parsed < 0) {
      return { valid: false, error: "Marks cannot be negative" };
    }

    if (parsed > maxMarks) {
      return { valid: false, error: `Marks cannot exceed ${maxMarks}` };
    }

    return { valid: true };
  },

  /**
   * Calculate statistics for a subject's marks
   */
  calculateSubjectStats(
    marks: Array<{
      value: string | number | null;
      maxMarks: number;
      passingMarks: number;
    }>,
  ): SubjectStats {
    let entered = 0;
    let absent = 0;
    let sum = 0;
    let highest = -Infinity;
    let lowest = Infinity;
    let passCount = 0;
    let failCount = 0;

    marks.forEach(({ value, maxMarks: _maxMarks, passingMarks }) => {
      const parsed = this.parseMarksValue(value as string | number);

      if (parsed === "AB") {
        absent++;
      } else if (parsed !== null && typeof parsed === "number") {
        entered++;
        sum += parsed;
        highest = Math.max(highest, parsed);
        lowest = Math.min(lowest, parsed);

        if (parsed >= passingMarks) {
          passCount++;
        } else {
          failCount++;
        }
      }
    });

    const pending = marks.length - entered - absent;

    return {
      total: marks.length,
      entered,
      absent,
      pending,
      sum,
      average: entered > 0 ? Math.round((sum / entered) * 100) / 100 : 0,
      highest: highest === -Infinity ? 0 : highest,
      lowest: lowest === Infinity ? 0 : lowest,
      passCount,
      failCount,
      passPercentage:
        entered > 0 ? Math.round((passCount / entered) * 10000) / 100 : 0,
    };
  },

  /**
   * Calculate student's total marks across subjects
   */
  calculateStudentTotal(
    marks: Array<{ value: string | number | null; maxMarks: number }>,
  ): StudentTotal {
    let total = 0;
    let maxTotal = 0;
    let subjectsAttempted = 0;
    let absent = 0;

    marks.forEach(({ value, maxMarks }) => {
      const parsed = this.parseMarksValue(value as string | number);

      if (parsed === "AB") {
        absent++;
      } else if (parsed !== null && typeof parsed === "number") {
        total += parsed;
        maxTotal += maxMarks;
        subjectsAttempted++;
      }
    });

    const percentage =
      maxTotal > 0 ? Math.round((total / maxTotal) * 10000) / 100 : 0;

    return {
      total,
      maxTotal,
      percentage,
      subjectsAttempted,
      absent,
      grade: this.calculateGrade(percentage),
    };
  },

  /**
   * Calculate grade based on percentage
   */
  calculateGrade(percentage: number): string {
    if (percentage >= 90) {
      return "A+";
    }
    if (percentage >= 80) {
      return "A";
    }
    if (percentage >= 70) {
      return "B+";
    }
    if (percentage >= 60) {
      return "B";
    }
    if (percentage >= 50) {
      return "C";
    }
    if (percentage >= 40) {
      return "D";
    }
    return "F";
  },

  /**
   * Get grade color for UI
   */
  getGradeColor(grade: string): string {
    const colors: Record<string, string> = {
      "A+": "text-emerald-600",
      A: "text-green-600",
      "B+": "text-blue-600",
      B: "text-blue-500",
      C: "text-yellow-600",
      D: "text-orange-600",
      F: "text-red-600",
    };
    return colors[grade] || "text-gray-600";
  },

  /**
   * Natural sort for roll numbers (handles alphanumeric)
   */
  naturalSortByRollNumber<T extends { roll_number?: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const rollA = a.roll_number || "";
      const rollB = b.roll_number || "";

      // Extract numeric parts for comparison
      const numA = Number.parseInt(rollA.replace(/\D/g, ""), 10);
      const numB = Number.parseInt(rollB.replace(/\D/g, ""), 10);

      // If both have numeric parts, compare numerically
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        return numA - numB;
      }

      // Otherwise, compare as strings
      return rollA.localeCompare(rollB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  },
};

export type MarksService = typeof marksService;
