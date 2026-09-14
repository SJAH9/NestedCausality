#!/usr/bin/env python3
"""Check the square-addressed formula against row evolution.

Run: python3 r30_agreement.py
Python 3.9+; standard library only. No research files are needed.

Set-based full-cone evolution and integer-bitset center evolution. 
All methods start with a lone 1 seed and zero cells elsewhere. 
These are finite agreement checks.
"""

import math
import unittest


def flattened_r30(count: int) -> list[int]:
    """Generate F(n) using square row starts and masked parent indices.

    F(0) = 1; t = floor(sqrt(n)); r = n - t*t.
    F(n) = L XOR (C OR R), with parents outside row t-1 set to zero.
    """
    if count < 1:
        return []
    states = [1]
    for n in range(1, count):
        t = math.isqrt(n)
        r = n - t * t
        left = states[n - 2 * t - 1] if r >= 2 else 0
        center = states[n - 2 * t] if 1 <= r <= 2 * t - 1 else 0
        right = states[n - 2 * t + 1] if r <= 2 * t - 2 else 0
        states.append(left ^ (center | right))
    return states


def center_r30(rows: int) -> list[int]:
    """Select c(t) = F(t*(t+1)) from the flattened formula."""
    if rows < 1:
        return []
    states = flattened_r30((rows - 1) * rows + 1)
    return [states[t * (t + 1)] for t in range(rows)]


def next_row(active: set[int], time: int) -> set[int]:
    """Conventional spatial evolution using the Rule 30 truth table."""
    result = set()
    for position in range(-time - 1, time + 2):
        neighborhood = (
            (4 if position - 1 in active else 0)
            | (2 if position in active else 0)
            | (1 if position + 1 in active else 0)
        )
        if (30 >> neighborhood) & 1:
            result.add(position)
    return result


def flattened_bits(count: int) -> list[int]:
    """Flatten conventional rows, without the formula's parent addressing."""
    if count < 1:
        return []
    result = []
    active = {0}
    time = 0
    while len(result) < count:
        result.extend(int(j in active) for j in range(-time, time + 1))
        active = next_row(active, time)
        time += 1
    return result[:count]


def center_bits(samples: int) -> list[int]:
    """Conventional row evolution with each row packed into an integer.

    In row t, position j occupies bit j+t, so the center is bit t.
    Shifts align the left, middle and right parents for the next row.
    """
    if samples < 1:
        return []
    row = 1
    centers = [1]
    for t in range(1, samples):
        row = (row << 2) ^ ((row << 1) | row)
        centers.append((row >> t) & 1)
    return centers


class AgreementTests(unittest.TestCase):
    def test_flattened_formula_matches_independent_evolution(self):
        """65,536 cells: all cells in rows 0 through 255."""
        self.assertEqual(flattened_r30(65536), flattened_bits(65536))

    def test_center_formula_matches_independent_evolution(self):
        """4,096 center states: times 0 through 4,095."""
        self.assertEqual(center_r30(4096), center_bits(4096))


if __name__ == "__main__":
    unittest.main(verbosity=2)
