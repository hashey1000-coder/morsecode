export const ADS_SCRIPT_SRC = 'https://avads.live/s/av-morse-codetranslator.js';

export const AD_UNIT_IDS = {
  anchor: 'Morse-codetranslator_Anchor_ATF',
  topLeaderboard: 'Morse-codetranslator_Top_Leaderboard_ATF',
  bottom: 'Morse-codetranslator_Bottom_BTF',
  inContentLazy: 'Morse-codetranslator_Incontent_Lazy',
} as const;

export function buildLazyRepeaterMarkup(index: number): string {
  return `<div class="lazy" parent-unit="${AD_UNIT_IDS.inContentLazy}" data-ad-repeater="${index}"></div>`;
}