"""Wrapper delegating to scripts.benchmark.run_benchmark for backward compatibility."""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from scripts.benchmark.run_benchmark import run_benchmark

def run_all_benchmarks(output_base: str = "outputs"):
    return run_benchmark(output_base=output_base)

if __name__ == "__main__":
    run_all_benchmarks()
