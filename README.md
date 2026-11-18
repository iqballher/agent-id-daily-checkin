# Agent ID Daily Check-in

A daily check-in dApp for Binance Agent ID holders on BNB Chain,
built for the **Binance Agent ID Hackathon** (submission period
2026-11-18 to 2026-12-09, 60,000 USDC total rewards).

## What it is

Any wallet holding an Agent ID can check in **once per UTC day**
(gas only). The contract tracks each holder's current
consecutive-day streak and total check-ins, and keeps an on-chain
list of every address that has ever checked in, so the frontend can
render a leaderboard of top streaks.

There is no token, no payment, no prize, and no promised return.
Checking in is a small daily habit for Agent ID holders, and the
streak is the whole point.

## How Agent ID is used

- **Access control.** `checkIn()` requires the caller to hold an
  Agent ID. The contract calls `balanceOf(caller)` on the Agent ID
  contract (`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`, SPACE ID
  Agent ID, ERC-721, non-transferable, BNB Chain) and reverts with
  `no Agent ID` when the balance is zero.
- **Identity.** Streaks are keyed by holder address, so each Agent ID
  holder has one persistent, public check-in record.
- **Leaderboard.** The `checkers` array plus the `checkins` mapping
  let anyone read every holder's streak on-chain and rank them.

## Safety

- No QR-code login, no session storage, no signing on behalf of users.
- Every check-in is a transaction the user sees and confirms in
  their own wallet. The contract never moves user funds.
- No owner role, no pause, no mint, no tax, no upgrade, no backdoor.
- No seed phrase, private key, API secret, or pairing code is ever
  collected. The frontend only uses the wallet's EIP-1193 provider.
- No returns are promised anywhere in the contract or the copy.
- The project does not use the Binance or BNB brand in its name.

## Project layout

```
contracts/AgentCheckin.sol   the check-in contract (NatSpec documented)
contracts/MockAgentID.sol    test-only mock, NOT part of the submission
scripts/compile.js           compile with solc-js, print gas estimates
scripts/deploy.js            deploy to BSC (DO NOT RUN until approved)
test/checkin.test.js         automated tests (Ganache + mock Agent ID)
test/manual-test-plan.md     post-deploy checks on BSC
frontend/index.html          static page
frontend/app.js              wallet connect, check-in, leaderboard
```

## Build and test (no deployment, no funds)

```bash
npm install
node scripts/compile.js     # compiles, writes build/, prints gas estimates
node test/checkin.test.js   # 17 automated tests on a local Ganache chain
```

Tested: 17/17 passing. First check-in (new user) used 118,954 gas;
a repeat check-in used 37,772 gas on the local chain.

## Deployment (only when explicitly approved)

```bash
# 1. Confirm the deployer balance covers the deploy at the live gas price.
# 2. Deploy (reads DEPLOYER_KEY from the environment only):
DEPLOYER_KEY=<key> RPC_URL=https://bsc-dataseed.binance.org/ node scripts/deploy.js
# 3. Verify the source on BscScan (flatten or standard JSON input,
#    compiler 0.8.28, optimizer enabled, runs 200) and make it public.
# 4. Set CONTRACT_ADDRESS in frontend/app.js to the deployed address.
# 5. Host the frontend (any static host) and run test/manual-test-plan.md.
```

**DEPLOYED 2026-11-18 ~19:23 WIB** (Iqbal: "Gass deploy kalo fee nya cukup"):
deployed via the EIP-2470 Singleton Factory (`0xce0042B868300000d44A59004Da54A005ffdcf9f`,
CREATE2, salt `keccak256("AgentCheckin-mpshhh.ai-v1")`) because `baw`
has no contract-creation command — `baw contract-call` requires `--to`.
Contract: **`0xdee91a9eaf6232ccc640aff17c3abfe981d0104b`**.
Deploy tx `0xea64862e08afcb1efbdb5e613c996696dc559c02a6aaa39a4793c5789340f146`,
block 134310734, status 1, gas 416,261 @ 0.10300517 gwei = **0.000042877 BNB**.
Verified on 2 RPCs: runtime code 1,657 bytes, `agentId()` =
`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`, `currentDay()` = 20775.
Wallet balance after deploy: 0.001117 BNB. `CONTRACT_ADDRESS` in
`frontend/app.js` is set. Still TODO: BscScan source verification,
frontend hosting, manual test plan, hackathon submission (no form
found yet — announcement lists no project-submission link).

Deploy gas estimate from compilation (init code 1,893 bytes):
about 430,000-480,000 gas. At 0.1 gwei that is about 0.000043-0.000048
BNB; at 1 gwei about 0.000430-0.000480 BNB; at 3 gwei about
0.001289-0.001439 BNB. Always re-check the live gas price and the
deployer balance first — a gas spike can make the deploy unaffordable
for a nearly empty wallet.

## Hackathon submission materials

- **Project name:** Agent ID Daily Check-in
- **Website:** (fill in after hosting the frontend)
- **Contract address:** `0xdee91a9eaf6232ccc640aff17c3abfe981d0104b` (deployed 2026-11-18, tx `0xea64862e08afcb1efbdb5e613c996696dc559c02a6aaa39a4793c5789340f146`)
- **Agent ID usage description:** The contract gates `checkIn()` on
  holding an Agent ID by calling `balanceOf` on the Agent ID
  contract, keys each streak to the holder's address, and exposes
  the full check-in list on-chain for the leaderboard. Agent ID is
  the product's access control and identity layer.
- **Source code:** this repository (open-source, MIT).
- **BscScan verification:** (link after verifying)

## License

MIT.
