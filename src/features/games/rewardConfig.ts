/** UI 안내용 테스트 기준입니다. 실제 판정의 source of truth는 game_reward_rules 테이블입니다. */
export const testRewardCriteria = {
  normal: { minimumScore: 60, requiresSuccess: true },
  premium: { minimumScore: 90, requiresSuccess: true },
} as const;
