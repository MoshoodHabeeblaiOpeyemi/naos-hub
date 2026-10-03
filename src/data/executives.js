/**
 * NAOS Unilorin — current executives.
 * ---------------------------------------------------------------------------
 * ⚠️  PLACEHOLDER CONTENT — DO NOT PUBLISH AS-IS.
 * The names below are invented samples so the layout can be reviewed.
 * Replace every `name`, `level` and `department` with the verified details
 * from the General Secretary before this site goes live, then set
 * `contentStatus` to 'verified' in site.js.
 *
 * TO ADD A REAL PORTRAIT
 *   1. Drop the file in  public/images/executives/
 *   2. Name it after the exec's id, lowercase:  president.jpg , gensec.jpg
 *   3. Set that exec's `photo` to '/images/executives/president.jpg'
 *   Leave `photo: null` to keep the initials fallback — it looks intentional.
 *
 * KEEP THIS FILE PURE DATA (see the architecture note in site.js).
 */

/** @typedef {{ id: string, name: string, position: string, level: string, department: string, photo: string | null }} Executive */

export const executives = [
  {
    id: 'president',
    name: 'Moshood Habeeblai Opeyemi',
    position: 'President',
    level: '400',
    department: 'Placeholder Department',
    photo: null,
  },
  {
    id: 'vice-president',
    name: 'Placeholder Name',
    position: 'Vice-President',
    level: '400',
    department: 'Placeholder Department',
    photo: null,
  },
  {
    id: 'gensec',
    name: 'Placeholder Name',
    position: 'General Secretary',
    level: '300',
    department: 'Placeholder Department',
    photo: null,
  },
  {
    id: 'pro1',
    name: 'Placeholder Name',
    position: 'PRO I',
    level: '300',
    department: 'Placeholder Department',
    photo: null,
  },
  {
    id: 'pro2',
    name: 'Placeholder Name',
    position: 'PRO II',
    level: '200',
    department: 'Placeholder Department',
    photo: null,
  },
  {
    id: 'finsec',
    name: 'Placeholder Name',
    position: 'Financial Secretary',
    level: '300',
    department: 'Placeholder Department',
    photo: null,
  },
  {
    id: 'treasurer',
    name: 'Placeholder Name',
    position: 'Treasurer',
    level: '300',
    department: 'Placeholder Department',
    photo: null,
  },
  {
    id: 'social',
    name: 'Placeholder Name',
    position: 'Social Director',
    level: '200',
    department: 'Placeholder Department',
    photo: null,
  },
  {
    id: 'sports',
    name: 'Placeholder Name',
    position: 'Sport Director',
    level: '200',
    department: 'Placeholder Department',
    photo: null,
  },
  {
    id: 'welfare',
    name: 'Placeholder Name',
    position: 'Welfare Director',
    level: '300',
    department: 'Placeholder Department',
    photo: null,
  },
  {
    id: 'auditor',
    name: 'Placeholder Name',
    position: 'Auditor',
    level: '300',
    department: 'Placeholder Department',
    photo: null,
  },
];

/**
 * Roles defined by the association constitution, in order of precedence.
 * The Executive's role assignment (Stage 2+) will key off these ids.
 */
export const executiveRoles = [
  'president',
  'vice-president',
  'gensec',
  'pro1',
  'pro2',
  'finsec',
  'treasurer',
  'social',
  'sports',
  'welfare',
  'auditor',
];

/** Helper used by components to render the initials fallback avatar. */
export function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}
