import test from "node:test";
import assert from "node:assert/strict";

interface BudgetSlice {
  category: string;
  pct: number;
}

function calculateBalancedBudget(
  totalBudget: number,
  slices: BudgetSlice[]
): Array<{ category: string; allocatedAmount: number; percentage: number }> {
  let runningSum = 0;
  const result: Array<{ category: string; allocatedAmount: number; percentage: number }> = [];

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    let amount = Math.round(totalBudget * (slice.pct / 100));
    runningSum += amount;

    // Last category absorbs rounding differences to ensure mathematical precision
    if (i === slices.length - 1) {
      amount += totalBudget - runningSum;
    }

    result.push({
      category: slice.category,
      allocatedAmount: amount,
      percentage: slice.pct,
    });
  }

  return result;
}

function applyDynamicBudgetCut(
  currentAllocations: Array<{ category: string; allocatedAmount: number }>,
  cutPercent: number
): { newTotal: number; allocations: Array<{ category: string; allocatedAmount: number }> } {
  const multiplier = (100 - cutPercent) / 100;
  const currentTotal = currentAllocations.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const newTotal = Math.round(currentTotal * multiplier);

  let runningSum = 0;
  const allocations = currentAllocations.map((cat, idx) => {
    let newAlloc = Math.round(cat.allocatedAmount * multiplier);
    runningSum += newAlloc;
    if (idx === currentAllocations.length - 1) {
      newAlloc += newTotal - runningSum;
    }
    return {
      category: cat.category,
      allocatedAmount: newAlloc,
    };
  });

  return { newTotal, allocations };
}

test("Budget Mathematical Precision Suite", async (t) => {
  const weddingSlices: BudgetSlice[] = [
    { category: "Venue & Rentals", pct: 35 },
    { category: "Catering & Bar", pct: 30 },
    { category: "Photography", pct: 12 },
    { category: "Floral & Decor", pct: 11 },
    { category: "Entertainment", pct: 8 },
    { category: "Stationery & Favors", pct: 4 },
  ];

  await t.test("allocations sum exactly to total budget without floating point errors ($32,500)", () => {
    const total = 32500;
    const allocations = calculateBalancedBudget(total, weddingSlices);
    const sum = allocations.reduce((acc, a) => acc + a.allocatedAmount, 0);
    assert.equal(sum, total);
  });

  await t.test("allocations sum exactly for non-round odd totals ($17,347)", () => {
    const total = 17347;
    const allocations = calculateBalancedBudget(total, weddingSlices);
    const sum = allocations.reduce((acc, a) => acc + a.allocatedAmount, 0);
    assert.equal(sum, total);
  });

  await t.test("percentages sum to 100%", () => {
    const sumPct = weddingSlices.reduce((acc, s) => acc + s.pct, 0);
    assert.equal(sumPct, 100);
  });
});

test("Dynamic Re-Plan Budget Cut Engine", async (t) => {
  const initial = [
    { category: "Venue", allocatedAmount: 10000 },
    { category: "Catering", allocatedAmount: 8000 },
    { category: "Photo", allocatedAmount: 4000 },
    { category: "Decor", allocatedAmount: 3000 },
  ];

  await t.test("applies 25% budget cut and maintains exact rebalanced sum", () => {
    const cutResult = applyDynamicBudgetCut(initial, 25);
    assert.equal(cutResult.newTotal, 18750); // 25,000 * 0.75 = 18,750
    const finalSum = cutResult.allocations.reduce((acc, a) => acc + a.allocatedAmount, 0);
    assert.equal(finalSum, 18750);
  });

  await t.test("applies 15% budget cut cleanly", () => {
    const cutResult = applyDynamicBudgetCut(initial, 15);
    assert.equal(cutResult.newTotal, 21250); // 25,000 * 0.85 = 21,250
    const finalSum = cutResult.allocations.reduce((acc, a) => acc + a.allocatedAmount, 0);
    assert.equal(finalSum, 21250);
  });
});
