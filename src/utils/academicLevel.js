/**
 * Calculates a student's current academic level based on their entry year and course duration.
 *
 * Rules:
 * - If the current month is October or later, the academic year is (Current Year - Entry Year) + 1.
 * - Otherwise (before October), the academic year is (Current Year - Entry Year).
 * - If calculated year exceeds the Course Duration, level is 'Postgraduate'.
 * - Otherwise, level is returned as `${academicYear * 100}L` (e.g. '100L', '200L', '300L', '400L', '500L').
 *
 * @param {number|string} entryYear - The student's year of admission (e.g. 2023)
 * @param {number|string} courseDuration - Length of degree programme in years (e.g. 4 or 5)
 * @param {Date} [currentDate=new Date()] - Date object used for evaluation (defaults to now)
 * @returns {string} Calculated level ('100L' ... '500L' or 'Postgraduate')
 */
export function calculateAcademicLevel(entryYear, courseDuration, currentDate = new Date()) {
  const parsedEntryYear = Number(entryYear);
  const parsedDuration = Number(courseDuration);

  if (!parsedEntryYear || !parsedDuration) {
    return '';
  }

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1 = January, 10 = October

  let academicYear;
  if (currentMonth >= 10) {
    academicYear = (currentYear - parsedEntryYear) + 1;
  } else {
    academicYear = currentYear - parsedEntryYear;
  }

  // Guard against future entry year or session not yet started
  if (academicYear <= 0) {
    academicYear = 1;
  }

  if (academicYear > parsedDuration) {
    return 'Postgraduate';
  }

  return `${academicYear * 100}L`;
}
