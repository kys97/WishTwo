# Game rewards backend setup

Apply the SQL files in this order:

1. `schema.sql`
2. `wishes.sql`
3. `game_rewards.sql`

`game_rewards.sql` creates the game catalog, configurable reward rules, play records, reward ledger, RLS policies, and the `start_game` / `finish_game` RPC functions. Clients cannot directly insert game results or update ticket balances.

The current test rules award one normal ticket for a successful score of at least 60 and one Premium ticket for a successful score of at least 90. The highest matching rule wins. Change rows in `game_reward_rules` to adjust this without changing application code.
