import os
import random
import pandas as pd
import numpy as np

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
OUTPUT_CSV = os.path.join(DATA_DIR, "invoice_training.csv")


def generate_training_dataset(num_samples: int = 1500) -> pd.DataFrame:
    """
    Generates synthetic training dataset for VeriFlow ML Risk Classifier.
    Labels:
      0 = NORMAL (Clean, standard invoice within policies)
      1 = SUSPICIOUS (Anomalous, duplicate candidate, or rule-violating)

    NOTICE: 'SUSPICIOUS' represents an anomaly signal requiring human review, NOT proven fraud.
    THIS IS DEMO / TRAINING DATA.
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    records = []

    # 1. Clean / Normal Invoices (~60% of dataset)
    clean_count = int(num_samples * 0.6)
    for _ in range(clean_count):
        amt = round(random.uniform(5000, 180000), 2)
        tax_rate = random.choice([0.05, 0.12, 0.18, 0.28])
        tax = round(amt * tax_rate, 2)
        tot = round(amt + tax, 2)
        sup_cnt = random.randint(3, 40)
        # Low deviation from historical average
        sup_avg = round(amt * random.uniform(0.85, 1.15), 2)
        sup_dev = round(abs(amt - sup_avg), 2)
        dev_pct = round((sup_dev / sup_avg) * 100, 2)
        days = round(random.uniform(15, 60), 1)

        records.append({
            "invoice_amount": amt,
            "tax_amount": tax,
            "tax_percentage": round(tax_rate * 100, 2),
            "total_amount": tot,
            "missing_field_count": 0,
            "duplicate_similarity": 0.0,
            "supplier_invoice_count": sup_cnt,
            "supplier_average_amount": sup_avg,
            "supplier_amount_deviation": sup_dev,
            "amount_deviation_percentage": dev_pct,
            "days_since_previous_supplier_invoice": days,
            "policy_violation_count": 0,
            "validation_error_count": 0,
            "previous_duplicate_count": 0,
            "label": 0,  # NORMAL
        })

    # 2. Duplicate Candidates (~10% of dataset)
    dup_count = int(num_samples * 0.1)
    for _ in range(dup_count):
        amt = round(random.uniform(10000, 250000), 2)
        tax = round(amt * 0.18, 2)
        tot = round(amt + tax, 2)
        records.append({
            "invoice_amount": amt,
            "tax_amount": tax,
            "tax_percentage": 18.0,
            "total_amount": tot,
            "missing_field_count": 0,
            "duplicate_similarity": round(random.uniform(0.80, 1.0), 2),
            "supplier_invoice_count": random.randint(2, 20),
            "supplier_average_amount": amt,
            "supplier_amount_deviation": 0.0,
            "amount_deviation_percentage": 0.0,
            "days_since_previous_supplier_invoice": round(random.uniform(0.5, 7.0), 1),
            "policy_violation_count": 0,
            "validation_error_count": 1,
            "previous_duplicate_count": random.randint(1, 3),
            "label": 1,  # SUSPICIOUS
        })

    # 3. Tax Mismatch Invoices (~10% of dataset)
    tax_count = int(num_samples * 0.1)
    for _ in range(tax_count):
        amt = round(random.uniform(20000, 200000), 2)
        tax = round(amt * 0.18, 2)
        # Discrepancy in recorded total
        variance = round(random.uniform(1000, 25000), 2)
        tot = round(amt + tax + variance, 2)
        records.append({
            "invoice_amount": amt,
            "tax_amount": tax,
            "tax_percentage": round(random.uniform(2.0, 45.0), 2),
            "total_amount": tot,
            "missing_field_count": 0,
            "duplicate_similarity": 0.0,
            "supplier_invoice_count": random.randint(2, 15),
            "supplier_average_amount": round(amt * random.uniform(0.9, 1.1), 2),
            "supplier_amount_deviation": round(random.uniform(1000, 10000), 2),
            "amount_deviation_percentage": round(random.uniform(5, 15), 2),
            "days_since_previous_supplier_invoice": round(random.uniform(10, 45), 1),
            "policy_violation_count": 0,
            "validation_error_count": 1,
            "previous_duplicate_count": 0,
            "label": 1,  # SUSPICIOUS
        })

    # 4. Policy Limit Violations (~10% of dataset)
    pol_count = int(num_samples * 0.1)
    for _ in range(pol_count):
        # Exceeds threshold of 300,000
        amt = round(random.uniform(320000, 1200000), 2)
        tax = round(amt * 0.18, 2)
        tot = round(amt + tax, 2)
        sup_avg = round(random.uniform(80000, 200000), 2)
        sup_dev = round(amt - sup_avg, 2)
        dev_pct = round((sup_dev / sup_avg) * 100, 2)

        records.append({
            "invoice_amount": amt,
            "tax_amount": tax,
            "tax_percentage": 18.0,
            "total_amount": tot,
            "missing_field_count": 0,
            "duplicate_similarity": 0.0,
            "supplier_invoice_count": random.randint(1, 10),
            "supplier_average_amount": sup_avg,
            "supplier_amount_deviation": sup_dev,
            "amount_deviation_percentage": dev_pct,
            "days_since_previous_supplier_invoice": round(random.uniform(10, 60), 1),
            "policy_violation_count": 1,
            "validation_error_count": 1,
            "previous_duplicate_count": 0,
            "label": 1,  # SUSPICIOUS
        })

    # 5. Missing Fields & Anomalous Vendor Behavior (~10% of dataset)
    misc_count = num_samples - len(records)
    for _ in range(misc_count):
        amt = round(random.uniform(5000, 95000), 2)
        tax = round(amt * 0.18, 2)
        tot = round(amt + tax, 2)
        missing = random.choice([1, 2])
        records.append({
            "invoice_amount": amt,
            "tax_amount": tax,
            "tax_percentage": 18.0,
            "total_amount": tot,
            "missing_field_count": missing,
            "duplicate_similarity": 0.0,
            "supplier_invoice_count": random.randint(1, 5),
            "supplier_average_amount": amt,
            "supplier_amount_deviation": 0.0,
            "amount_deviation_percentage": 0.0,
            "days_since_previous_supplier_invoice": round(random.uniform(1, 90), 1),
            "policy_violation_count": 0,
            "validation_error_count": missing,
            "previous_duplicate_count": 0,
            "label": 1,  # SUSPICIOUS
        })

    df = pd.DataFrame(records)
    # Shuffle
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Generated {len(df)} synthetic training records saved to: {OUTPUT_CSV}")
    print(f"  - Normal records (0): {sum(df['label'] == 0)}")
    print(f"  - Suspicious records (1): {sum(df['label'] == 1)}")
    return df


if __name__ == "__main__":
    generate_training_dataset(1500)
