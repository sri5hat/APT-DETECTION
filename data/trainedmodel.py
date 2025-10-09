"""Train a simple classifier for the APT dataset.

This script is intentionally lightweight and dependency-minimal. It supports
loading datasets from CSV or JSON (records) and expects a target column named
"label" (binary: 0/1 or string). It trains a scikit-learn RandomForest
classifier with a small grid search, prints evaluation metrics, and saves the
trained model and metrics to the `data/` folder.

Usage examples (from repository root):
  python data/trainedmodel.py --input data/apt_dataset.csv --target label --out model.joblib

If you don't have a dataset right now, you can create a tiny CSV with columns
`feature1,feature2,...,label` to test the script.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer


def load_dataset(path: str) -> pd.DataFrame:
	p = Path(path)
	if not p.exists():
		raise FileNotFoundError(f"Dataset not found: {path}")
	if p.suffix.lower() in {".csv", ".txt"}:
		return pd.read_csv(p)
	# assume JSON lines or JSON array
	try:
		return pd.read_json(p, orient="records", lines=True)
	except ValueError:
		return pd.read_json(p)


def split_features_target(df: pd.DataFrame, target: str) -> Tuple[pd.DataFrame, pd.Series]:
	if target not in df.columns:
		raise ValueError(f"Target column '{target}' not found in dataset columns: {list(df.columns)}")
	X = df.drop(columns=[target])
	y = df[target]
	# convert boolean/string labels to 0/1 when possible
	if y.dtype == object:
		y = y.map({"0": 0, "1": 1}).fillna(y)
	if y.dtype == bool:
		y = y.astype(int)
	return X, y


def build_pipeline(X: pd.DataFrame) -> Tuple[Pipeline, dict]:
	# detect numeric and categorical columns
	numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
	categorical_cols = X.select_dtypes(include=[object, "category", bool]).columns.tolist()

	numeric_transformer = Pipeline([
		("imputer", SimpleImputer(strategy="median")),
		("scaler", StandardScaler()),
	])

	categorical_transformer = Pipeline([
		("imputer", SimpleImputer(strategy="most_frequent")),
		("onehot", OneHotEncoder(handle_unknown="ignore", sparse=False)),
	])

	preprocessor = ColumnTransformer(
		transformers=[
			("num", numeric_transformer, numeric_cols),
			("cat", categorical_transformer, categorical_cols),
		],
		remainder="drop",
	)

	clf = RandomForestClassifier(random_state=42, n_jobs=-1)

	pipeline = Pipeline([("preprocessor", preprocessor), ("clf", clf)])

	# Small grid to keep runs fast; increase for better search
	param_grid = {
		"clf__n_estimators": [100, 200],
		"clf__max_depth": [None, 10, 20],
		"clf__min_samples_split": [2, 5],
	}

	return pipeline, param_grid


def train_and_evaluate(
	X: pd.DataFrame, y: pd.Series, out_path: str, test_size: float = 0.2, random_state: int = 42
):
	X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, stratify=y if y.nunique() > 1 else None, random_state=random_state)

	pipeline, param_grid = build_pipeline(X_train)

	search = GridSearchCV(pipeline, param_grid, cv=3, n_jobs=-1, scoring="f1", verbose=1)
	search.fit(X_train, y_train)

	best = search.best_estimator_

	y_pred = best.predict(X_test)

	metrics = classification_report(y_test, y_pred, output_dict=True)
	cm = confusion_matrix(y_test, y_pred).tolist()

	out_dir = Path(out_path).parent
	out_dir.mkdir(parents=True, exist_ok=True)

	model_path = out_path
	metrics_path = str(Path(out_dir) / "metrics.json")

	joblib.dump(best, model_path)
	with open(metrics_path, "w") as f:
		json.dump({"classification_report": metrics, "confusion_matrix": cm, "best_params": search.best_params_}, f, indent=2)
data/trainedmodel.py
	print("Training complete")
	print(f"Saved model to: {model_path}")
	print(f"Saved metrics to: {metrics_path}")


def parse_args():
	p = argparse.ArgumentParser(description="Train a simple classifier for the APT dataset")
	p.add_argument("--input", "-i", required=True, help="Path to input dataset (CSV or JSON)")
	p.add_argument("--target", "-t", default="label", help="Target column name (default: label)")
	p.add_argument("--out", "-o", default="data/model.joblib", help="Output path for saved model")
	p.add_argument("--test-size", type=float, default=0.2, help="Test set proportion")
	return p.parse_args()


def main():
	args = parse_args()
	df = load_dataset(args.input)
	X, y = split_features_target(df, args.target)
	train_and_evaluate(X, y, args.out, test_size=args.test_size)


if __name__ == "__main__":
	main()

