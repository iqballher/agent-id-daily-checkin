// Agent ID Daily Check-in frontend.
// Static page, no build step. Fill in CONTRACT_ADDRESS after deploying
// AgentCheckin.sol to BNB Chain and verifying it on BscScan.
// Requires a wallet (MetaMask or any EIP-1193 provider) on BNB Chain.
// The user always confirms the check-in transaction in their own wallet;
// this page never asks for a seed phrase, private key, or approval.
"use strict";

// TODO: set after deployment. Leave as the zero address until then.
const CONTRACT_ADDRESS = "0xdee91a9eaf6232ccc640aff17c3abfe981d0104b";
const BSC_CHAIN_ID = 56; // BNB Smart Chain mainnet

const ABI = [
  { inputs: [], name: "agentId", outputs: [{ internalType: "contract IAgentID", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "checkIn", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "checkerCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "", type: "uint256" }], name: "checkers", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "checkins", outputs: [{ internalType: "uint64", name: "lastDay", type: "uint64" }, { internalType: "uint64", name: "streak", type: "uint64" }, { internalType: "uint64", name: "total", type: "uint64" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "currentDay", outputs: [{ internalType: "uint64", name: "", type: "uint64" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "account", type: "address" }], name: "hasAgentId", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "hasCheckedIn", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
];

const $ = (id) => document.getElementById(id);
let provider = null;
let signer = null;
let contract = null;
let account = null;

function setStatus(msg) {
  $("status").textContent = msg;
}

async function ensureBsc() {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== BSC_CHAIN_ID) {
    setStatus("Please switch your wallet to BNB Smart Chain (chain ID 56).");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
    } catch (e) {
      // User declined or the chain is not added; leave the message up.
    }
    return false;
  }
  return true;
}

async function connect() {
  if (typeof window.ethereum === "undefined") {
    setStatus("No wallet found. Install a wallet (for example MetaMask) and reload.");
    return;
  }
  if (typeof ethers === "undefined") {
    setStatus("The ethers library failed to load. Check your connection and reload.");
    return;
  }
  if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    setStatus("The contract is not deployed yet. Come back after the deploy.");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    $("account").textContent = "Connected: " + account;
    if (!(await ensureBsc())) return;
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const holds = await contract.hasAgentId(account);
    if (!holds) {
      setStatus("This wallet does not hold an Agent ID, so it cannot check in.");
      $("mineCard").hidden = true;
      return;
    }
    setStatus("Agent ID confirmed. You can check in.");
    $("mineCard").hidden = false;
    await refreshMine();
    await refreshBoard();
  } catch (e) {
    setStatus("Connection failed: " + (e && e.message ? e.message : e));
  }
}

async function refreshMine() {
  if (!contract || !account) return;
  const s = await contract.checkins(account);
  $("myStreak").textContent = s.streak.toString();
  $("myTotal").textContent = s.total.toString();
  $("myLastDay").textContent = s.lastDay.toString();
  const day = await contract.currentDay();
  $("checkinBtn").disabled = s.lastDay === day;
  $("checkinBtn").textContent = s.lastDay === day ? "Already checked in today" : "Check in for today";
}

async function checkIn() {
  if (!contract) return;
  $("checkinBtn").disabled = true;
  setStatus("Confirm the transaction in your wallet. You only pay gas.");
  try {
    const tx = await contract.checkIn();
    setStatus("Transaction sent: " + tx.hash + " — waiting for confirmation…");
    await tx.wait();
    setStatus("Checked in. Streak updated.");
    await refreshMine();
    await refreshBoard();
  } catch (e) {
    setStatus("Check-in failed: " + (e && e.message ? e.message : e));
    $("checkinBtn").disabled = false;
  }
}

async function refreshBoard() {
  if (!contract) {
    // Read-only leaderboard without a wallet, if the contract is set.
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000" || typeof ethers === "undefined") return;
    provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  }
  const tbody = $("board");
  tbody.innerHTML = '<tr><td colspan="4" class="muted">Loading…</td></tr>';
  try {
    const n = Number(await contract.checkerCount());
    const rows = [];
    // Cap the read at 500 addresses so the page stays responsive.
    for (let i = 0; i < Math.min(n, 500); i++) {
      const addr = await contract.checkers(i);
      const s = await contract.checkins(addr);
      rows.push({ addr, streak: Number(s.streak), total: Number(s.total) });
    }
    rows.sort((a, b) => b.streak - a.streak || b.total - a.total);
    tbody.innerHTML = rows
      .slice(0, 50)
      .map((r, i) => `<tr><td>${i + 1}</td><td>${r.addr.slice(0, 6)}…${r.addr.slice(-4)}</td><td>${r.streak}</td><td>${r.total}</td></tr>`)
      .join("") || '<tr><td colspan="4" class="muted">No check-ins yet.</td></tr>';
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">Could not load the leaderboard: ' + (e && e.message ? e.message : e) + "</td></tr>";
  }
}

$("connectBtn").addEventListener("click", connect);
$("checkinBtn").addEventListener("click", checkIn);
$("refreshBtn").addEventListener("click", refreshBoard);
refreshBoard();
