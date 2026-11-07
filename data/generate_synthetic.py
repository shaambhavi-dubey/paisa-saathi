#!/usr/bin/env python3
"""
Synthetic data generator for Paisa Saathi. ALL DATA IS FAKE. No real people or accounts.

Run (from project root):
    python data/generate_synthetic.py --n 2000 --seed 42 --out data/synthetic

Outputs (CSV, in --out):
    customers.csv     one row per customer: persona, loan, device, stress and scam labels
    transactions.csv  every credit/debit with counterparty, device, balance, fraud label
    emis.csv          every EMI due: paid / late / missed
    nodes.csv         graph nodes (customers, merchants, persons, mules, cash-outs)
    graph_edges.csv   mule layering edges (mule -> cash-out) to complete the fraud graph

Window: 2026-04-01 to 2026-09-30 (183 days).

What is injected (so you can train and evaluate on known labels):
    - 4 personas with different cash-flow rhythms (vendor, gig_worker, farmer, salaried)
    - Financial stress (~15% of customers): inflows decline from a known onset date,
      which naturally produces late and missed EMIs
    - Scam victims (~4%): burst of large payments to new "mule" accounts
    - Mule rings: accounts that share devices, are very new, fan-in from victims,
      and fan-out to shared cash-out accounts
    - Hard negatives: legit large family transfers and customers who share a device
"""

import argparse
import os
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

START = datetime(2026, 4, 1)
DAYS = 183
PERSONAS = {"vendor": 0.35, "gig_worker": 0.25, "farmer": 0.20, "salaried": 0.20}
HAS_LOAN_P = {"vendor": 0.50, "gig_worker": 0.45, "farmer": 0.40, "salaried": 0.60}
HH_SHARE = {"vendor": 0.30, "gig_worker": 0.30, "farmer": 0.35, "salaried": 0.35}
N_MERCHANTS = 200
N_PERSONS = 3000
STRESS_P = 0.15
SCAM_P = 0.04


# ----------------------------------------------------------------------------
# Customers
# ----------------------------------------------------------------------------
def make_customers(n, rng):
    personas = rng.choice(list(PERSONAS), size=n, p=list(PERSONAS.values()))
    base_med = {"vendor": 1100, "gig_worker": 800, "farmer": 450, "salaried": 850}
    base_sig = {"vendor": 0.35, "gig_worker": 0.30, "farmer": 0.40, "salaried": 0.30}
    rows = []
    for i, p in enumerate(personas):
        base = rng.lognormal(np.log(base_med[p]), base_sig[p])  # avg Rs/day
        has_loan = rng.random() < HAS_LOAN_P[p]
        stressed = rng.random() < STRESS_P
        onset = int(rng.integers(80, 131)) if stressed else -1
        victim = rng.random() < SCAM_P
        rows.append(dict(
            customer_id=f"C{i:05d}",
            persona=p,
            age=int(np.clip(rng.normal(38, 10), 21, 70)),
            language=rng.choice(["hi", "hinglish", "en"], p=[0.7, 0.2, 0.1]),
            tier=int(rng.choice([2, 3, 4], p=[0.3, 0.4, 0.3])),
            base_daily_income=round(base, 2),
            has_loan=has_loan,
            emi_amount=round(base * 30 * rng.uniform(0.06, 0.14), 0) if has_loan else 0,
            emi_day=int(rng.integers(1, 29)),
            market_dow=int(rng.integers(0, 7)),
            salary_day=int(rng.integers(1, 6)),
            device_id=f"DV{i:05d}",
            stressed=stressed,
            stress_onset_day=onset,
            stress_factor=round(rng.uniform(0.35, 0.6), 2) if stressed else 1.0,
            scam_victim=victim,
            scam_day=int(rng.integers(20, DAYS - 2)) if victim else -1,
        ))
    df = pd.DataFrame(rows)
    # Hard negative: ~2% of customers share a device with another customer (family phone)
    k = max(1, int(0.02 * n))
    for j in rng.choice(n, size=k, replace=False):
        other = int(rng.integers(0, n))
        df.at[j, "device_id"] = df.at[other, "device_id"]
    df["stress_onset_date"] = df["stress_onset_day"].apply(
        lambda d: (START + timedelta(days=int(d))).date().isoformat() if d >= 0 else "")
    df["scam_date"] = df["scam_day"].apply(
        lambda d: (START + timedelta(days=int(d))).date().isoformat() if d >= 0 else "")
    return df


# ----------------------------------------------------------------------------
# Mule rings
# ----------------------------------------------------------------------------
def make_mules(n, rng):
    n_mules = max(30, n // 40)
    rings, mules, idx = [], [], 0
    ring_id = 0
    while idx < n_mules:
        size = int(rng.integers(4, 9))
        size = min(size, n_mules - idx)
        devices = [f"DM{ring_id:03d}_{k}" for k in range(int(rng.integers(1, 3)))]
        cashouts = [f"X{ring_id:03d}_{k}" for k in range(int(rng.integers(1, 3)))]
        ring = dict(ring_id=ring_id, devices=devices, cashouts=cashouts, mules=[])
        for _ in range(size):
            m = dict(mule_id=f"M{idx:04d}", ring_id=ring_id,
                     device_id=devices[int(rng.integers(0, len(devices)))],
                     age_days=int(rng.integers(3, 45)))
            ring["mules"].append(m)
            mules.append(m)
            idx += 1
        rings.append(ring)
        ring_id += 1
    return rings, mules


# ----------------------------------------------------------------------------
# Transactions
# ----------------------------------------------------------------------------
def simulate(customers, rings, rng):
    merchants = [f"MR{i:04d}" for i in range(N_MERCHANTS)]
    persons = [f"P{i:04d}" for i in range(N_PERSONS)]
    tx_rows, emi_rows = [], []
    tx_id = 0

    for c in customers.itertuples():
        p, base = c.persona, c.base_daily_income
        hh = base * HH_SHARE[p]
        balance = base * rng.uniform(3, 10)
        favs = [merchants[int(i)] for i in rng.integers(0, N_MERCHANTS, 6)]
        relative = persons[int(rng.integers(0, N_PERSONS))]
        remits = rng.random() < 0.35
        seen = set()
        pending = None

        # persona-specific plans
        harvest = {}
        kharif = {}
        if p == "farmer":
            total = base * 120
            k = int(rng.integers(2, 5))
            for dd in rng.choice(np.arange(5, 60), size=k, replace=False):
                harvest[int(dd)] = total / k * rng.uniform(0.7, 1.3)
            for dd in rng.choice(np.arange(65, 125), size=int(rng.integers(2, 4)), replace=False):
                kharif[int(dd)] = base * rng.uniform(8, 20)

        # scam plan
        scam_mule = None
        if c.scam_victim:
            ring = rings[int(rng.integers(0, len(rings)))]
            scam_mule = ring["mules"][int(rng.integers(0, len(ring["mules"])))]

        for d in range(DAYS):
            day = START + timedelta(days=d)
            dow = day.weekday()
            mult = 1.0
            if c.stressed and d >= c.stress_onset_day:
                ramp = min(1.0, (d - c.stress_onset_day) / 14)
                mult = 1 - ramp * (1 - c.stress_factor)

            ev = []  # (hour, direction, amount, category, counterparty, cp_type)

            # ---- inflows
            if p == "vendor":
                n_in = rng.poisson(7 * (1.8 if dow == c.market_dow else 1.0))
                for _ in range(n_in):
                    amt = rng.lognormal(np.log(base / 7 * 0.85), 0.5) * mult
                    ev.append((rng.uniform(8, 20), "credit", amt, "upi_sales",
                               persons[int(rng.integers(0, N_PERSONS))], "person"))
            elif p == "gig_worker":
                if rng.random() < 0.85:
                    ev.append((rng.uniform(18, 22), "credit",
                               rng.lognormal(np.log(base * 1.1), 0.35) * mult,
                               "platform_payout", "PLATFORM01", "platform"))
                if dow == 0 and rng.random() < 0.7:
                    ev.append((11, "credit", base * rng.uniform(1, 2.5) * mult,
                               "weekly_bonus", "PLATFORM01", "platform"))
            elif p == "farmer":
                if d in harvest:
                    ev.append((rng.uniform(10, 16), "credit", harvest[d] * mult,
                               "crop_sale", f"MANDI{int(rng.integers(0, 5))}", "mandi"))
                if rng.random() < 0.2:
                    ev.append((rng.uniform(9, 17), "credit", rng.uniform(200, 600) * mult,
                               "labour_income", persons[int(rng.integers(0, N_PERSONS))], "person"))
                if d in kharif:
                    ev.append((11, "debit", kharif[d], "farm_inputs",
                               favs[int(rng.integers(0, len(favs)))], "merchant"))
            else:  # salaried
                if day.day == c.salary_day:
                    ev.append((9, "credit", base * 30 * rng.uniform(0.95, 1.05) * mult,
                               "salary", "EMPLOYER01", "employer"))
                if rng.random() < 0.1:
                    ev.append((rng.uniform(9, 20), "credit", rng.uniform(100, 800),
                               "upi_credit", persons[int(rng.integers(0, N_PERSONS))], "person"))

            # ---- outflows
            n_hh = max(1, rng.poisson(3))
            for _ in range(n_hh):
                amt = hh / 3 * rng.uniform(0.6, 1.4) * rng.lognormal(0, 0.4)
                cp = favs[int(rng.integers(0, len(favs)))] if rng.random() < 0.85 \
                    else merchants[int(rng.integers(0, N_MERCHANTS))]
                ev.append((rng.uniform(7, 21), "debit", amt,
                           str(rng.choice(["groceries", "transport", "household"])), cp, "merchant"))
            if p == "vendor" and rng.random() < 0.5:
                ev.append((rng.uniform(5, 9), "debit", base * rng.uniform(0.2, 0.5),
                           "supplier_purchase", favs[0], "merchant"))
            if p == "gig_worker" and rng.random() < 0.9:
                ev.append((rng.uniform(8, 20), "debit", base * 0.12, "fuel", favs[1], "merchant"))
            if day.day == 10:
                ev.append((12, "debit", rng.uniform(300, 900), "electricity", "UTILITY01", "utility"))
            if day.day == (c.emi_day % 28) + 1:
                ev.append((13, "debit", rng.uniform(199, 299), "mobile_recharge", "TELCO01", "utility"))
            if p in ("salaried", "gig_worker") and day.day == 3:
                ev.append((10, "debit", base * 30 * 0.12, "rent", relative, "person"))
            if remits and rng.random() < 0.02:  # hard negative: big legit transfer
                ev.append((rng.uniform(10, 20), "debit", base * rng.uniform(2, 5),
                           "family_transfer", relative, "person"))

            # ---- scam burst
            if c.scam_victim and d == c.scam_day:
                t0 = rng.uniform(10, 18)
                for j in range(int(rng.integers(1, 4))):
                    amt = float(np.clip(base * rng.uniform(3, 12), 3000, 40000))
                    ev.append((t0 + j * rng.uniform(0.2, 0.7), "debit", amt, "transfer",
                               scam_mule["mule_id"], "mule"))

            # ---- apply the day's events in time order
            ev.sort(key=lambda e: e[0])
            for hour, direction, amt, cat, cp, cp_type in ev:
                if direction == "debit":
                    if cp_type == "mule":
                        amt = min(amt, balance * 0.9)
                        if amt < 1000:
                            continue
                    else:
                        amt = min(amt, max(balance, 0) * 0.95)
                        if amt < 20:
                            continue
                    balance -= amt
                else:
                    balance += amt
                is_new = int(direction == "debit" and cp not in seen)
                if direction == "debit":
                    seen.add(cp)
                ts = day + timedelta(hours=float(hour))
                dev = c.device_id if (cp_type == "mule" or rng.random() > 0.03) \
                    else f"{c.device_id}_B"
                tx_rows.append((f"T{tx_id:08d}", ts.isoformat(timespec="seconds"), c.customer_id,
                                direction, round(amt, 2), cat, cp, cp_type, dev,
                                round(balance, 2), is_new, int(cp_type == "mule")))
                tx_id += 1

            # ---- EMI logic (end of day)
            if c.has_loan:
                if day.day == c.emi_day:
                    pending = dict(due=day, amt=c.emi_amount)
                if pending:
                    late_days = (day - pending["due"]).days
                    if balance >= pending["amt"]:
                        balance -= pending["amt"]
                        status = "paid" if late_days == 0 else "late"
                        tx_rows.append((f"T{tx_id:08d}", (day + timedelta(hours=20.5)).isoformat(timespec="seconds"),
                                        c.customer_id, "debit", pending["amt"], "emi", "LENDER01", "bank",
                                        c.device_id, round(balance, 2), 0, 0))
                        tx_id += 1
                        emi_rows.append((c.customer_id, pending["due"].date().isoformat(),
                                         pending["amt"], status, day.date().isoformat()))
                        pending = None
                    elif late_days >= 5:
                        emi_rows.append((c.customer_id, pending["due"].date().isoformat(),
                                         pending["amt"], "missed", ""))
                        pending = None

    tx_cols = ["txn_id", "timestamp", "customer_id", "direction", "amount", "category",
               "counterparty_id", "counterparty_type", "device_id", "balance_after",
               "is_new_payee", "is_scam"]
    tx = pd.DataFrame(tx_rows, columns=tx_cols)
    emis = pd.DataFrame(emi_rows, columns=["customer_id", "due_date", "amount", "status", "paid_date"])
    return tx, emis, merchants, persons


# ----------------------------------------------------------------------------
# Graph pieces
# ----------------------------------------------------------------------------
def build_graph(customers, tx, rings, mules, merchants, persons, rng):
    mule_ring = {m["mule_id"]: next(r for r in rings if r["ring_id"] == m["ring_id"]) for m in mules}
    edges = []
    for r in tx[tx.counterparty_type == "mule"].itertuples():
        ring = mule_ring[r.counterparty_id]
        ts = datetime.fromisoformat(r.timestamp) + timedelta(hours=float(rng.uniform(0.5, 6)))
        target = ring["cashouts"][int(rng.integers(0, len(ring["cashouts"])))]
        if rng.random() < 0.3 and len(ring["mules"]) > 1:  # layering through a second mule
            hop = ring["mules"][int(rng.integers(0, len(ring["mules"])))]["mule_id"]
            if hop != r.counterparty_id:
                edges.append((r.counterparty_id, hop, ts.isoformat(timespec="seconds"), round(r.amount * 0.9, 2)))
                ts += timedelta(hours=float(rng.uniform(0.2, 2)))
                edges.append((hop, target, ts.isoformat(timespec="seconds"), round(r.amount * 0.8, 2)))
                continue
        edges.append((r.counterparty_id, target, ts.isoformat(timespec="seconds"), round(r.amount * 0.9, 2)))
    gedges = pd.DataFrame(edges, columns=["source", "target", "timestamp", "amount"])

    nodes = []
    for c in customers.itertuples():
        nodes.append((c.customer_id, "customer", c.device_id, int(rng.integers(300, 4000)), 0))
    for m in merchants:
        nodes.append((m, "merchant", "", int(rng.integers(200, 3000)), 0))
    for pid in persons:
        nodes.append((pid, "person", "", int(rng.integers(200, 4000)), 0))
    for m in mules:
        nodes.append((m["mule_id"], "mule", m["device_id"], m["age_days"], 1))
    for r in rings:
        for k, x in enumerate(r["cashouts"]):
            nodes.append((x, "cashout", r["devices"][k % len(r["devices"])], int(rng.integers(3, 45)), 1))
    nodes = pd.DataFrame(nodes, columns=["node_id", "node_type", "device_id", "account_age_days", "is_mule"])
    return nodes, gedges


# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=2000, help="number of customers")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="data/synthetic")
    a = ap.parse_args()

    rng = np.random.default_rng(a.seed)
    os.makedirs(a.out, exist_ok=True)

    print(f"Generating {a.n} synthetic customers (seed {a.seed})...")
    customers = make_customers(a.n, rng)
    rings, mules = make_mules(a.n, rng)
    tx, emis, merchants, persons = simulate(customers, rings, rng)
    nodes, gedges = build_graph(customers, tx, rings, mules, merchants, persons, rng)

    customers.drop(columns=["stress_onset_day", "scam_day"]).to_csv(f"{a.out}/customers.csv", index=False)
    tx.to_csv(f"{a.out}/transactions.csv", index=False)
    emis.to_csv(f"{a.out}/emis.csv", index=False)
    nodes.to_csv(f"{a.out}/nodes.csv", index=False)
    gedges.to_csv(f"{a.out}/graph_edges.csv", index=False)

    # ---- sanity summary
    print("\n=== SUMMARY ===")
    print("Customers by persona:\n", customers.persona.value_counts().to_string())
    print(f"\nTransactions: {len(tx):,}   scam txns: {int(tx.is_scam.sum())}   "
          f"customers with scam: {int(customers.scam_victim.sum())}")
    print(f"Mule accounts: {len(mules)} in {len(rings)} rings; graph edges: {len(gedges)}")
    print("\nEMI status counts:\n", emis.status.value_counts().to_string())
    m = emis.merge(customers[["customer_id", "stressed"]], on="customer_id")
    m["bad"] = m.status.isin(["late", "missed"])
    print("\nShare of EMIs late/missed (stressed vs not):")
    print(m.groupby("stressed").bad.mean().round(3).to_string())
    neg = tx[tx.balance_after < 0]
    print(f"\nNegative balances: {len(neg)} (should be 0)")
    print(f"\nFiles written to: {a.out}/")


if __name__ == "__main__":
    main()