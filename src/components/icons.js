import { h } from 'vue';

function makeIcon(paths) {
  return () => h('svg', {
    width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  }, paths.map((d) => h('path', { d })));
}

export const IconDash = makeIcon(['M4 13h6V4H4v9Z', 'M14 20h6v-9h-6v9Z', 'M14 4v3h6V4h-6Z', 'M4 17v3h6v-3H4Z']);
export const IconBox = makeIcon(['M3.5 7.5 12 3l8.5 4.5-8.5 4.5-8.5-4.5Z', 'M3.5 7.5v9L12 21l8.5-4.5v-9', 'M12 12v9']);
export const IconTag = makeIcon(['M20 12.5 12.5 20a1.5 1.5 0 0 1-2.1 0L4 13.6a1.5 1.5 0 0 1 0-2.1L11.5 4H19a1 1 0 0 1 1 1v7.5Z', 'M15.5 8.5h.01']);
export const IconPeople = makeIcon(['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M3 20c0-3 2.7-5 6-5s6 2 6 5', 'M17 8a2.5 2.5 0 1 0 0-5', 'M15.5 20c.3-2.5 2-4.3 4.5-4.6']);
export const IconCart = makeIcon(['M4 5h2l1.2 10.6a1.5 1.5 0 0 0 1.5 1.4h8.6a1.5 1.5 0 0 0 1.5-1.3L20 8H6.2', 'M9.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', 'M17.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z']);
export const IconReceipt = makeIcon(['M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.2V3Z', 'M9 8h6M9 12h6M9 16h3']);
export const IconUser = makeIcon(['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5']);
export const IconShield = makeIcon(['M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z', 'M9.5 12l1.8 1.8 3.2-3.6']);
