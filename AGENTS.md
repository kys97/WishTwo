# Couple Wish App Development Rules

## Design

- Figma is the UI source of truth.
- Do not redesign screens without explicit instruction.
- Match spacing, radius, typography, hierarchy and colors from Figma.
- Reference mobile frame size is 390 x 844.
- The actual implementation must adapt to different mobile screen sizes.
- Respect SafeArea on iOS and Android.

## Technology

- React Native
- Expo
- TypeScript
- Expo Router

## Architecture

- UI components must be reusable.
- Do not duplicate common Card, Button, Ticket, BottomTab components.
- Separate UI, business logic and server logic.
- Do not put Supabase calls directly inside presentational components.

## Navigation

Bottom tabs:

1. 홈
2. 게임
3. 소원권
4. 추억
5. 설정

## Design language

- Noto Sans KR
- Light neutral background
- Purple primary accent
- Rounded cards
- Premium features use purple/premium visual treatment.

## Rules

- Do not change existing working code unnecessarily.
- Before making a large change, inspect related files.
- Run typecheck/lint after implementation.
- Do not install libraries unless they are actually necessary.
- Do not modify unrelated screens.
