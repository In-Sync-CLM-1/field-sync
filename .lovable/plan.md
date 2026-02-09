

# Remove Insurance-Specific Language from Landing Page

Make the landing page industry-agnostic so it can appeal to any business with field sales teams (FMCG, real estate, pharma, etc.), not just insurance.

## Changes Summary

All changes are in **`src/pages/Landing.tsx`** only. Here is every replacement:

| Location | Current Text | New Text |
|----------|-------------|----------|
| Hero badge (line 88) | "Built for Insurance Field Teams" | "Built for Field Sales Teams" |
| Hero headline (line 95) | "Close More Policies." | "Close More Deals." |
| Hero subtitle (line 98) | "...follow-up, and policy closure across..." | "...follow-up, and deal closure across..." |
| Phone mockup stat (line 137) | "Policies MTD" | "Deals MTD" |
| Gold badge card (line 172) | "25 Policies This Month" | "25 Deals This Month" |
| Trust bar (line 193) | "Built for Indian Insurance Teams" | "Built for Indian Sales Teams" |
| Features subtitle (line 238) | "Purpose-built for insurance sales teams..." | "Purpose-built for field sales teams..." |
| Features - Prospects card (line 244) | "...insurance-specific fields: Policy Category (Life, Health, Motor, General), Premium Amount..." | "...industry-specific fields: Category, Deal Value, Source, Follow-up Date..." |
| Gamification text (line 274) | "Designed for Indian insurance sales culture" | "Designed for Indian field sales culture" |
| Badge requirements (lines 279-281) | "7/15/25 Policies / Month" | "7/15/25 Deals / Month" |
| Testimonials heading (line 324) | "Trusted by Insurance Field Teams" | "Trusted by Field Sales Teams" |
| Testimonial 1 role (line 327) | "Branch Manager, Life Insurance" | "Branch Manager" |
| Testimonial 2 text (line 328) | "Our policy closures are up 28%..." | "Our deal closures are up 28%..." |
| Testimonial 2 role (line 328) | "Regional Manager, Health Insurance" | "Regional Manager" |
| Testimonial 3 role (line 329) | "Sales Officer, General Insurance" | "Sales Officer" |
| Final CTA headline (line 422) | "Close More Policies?" | "Close More Deals?" |
| Final CTA subtitle (line 424) | "Join insurance teams who've already..." | "Join field teams who've already..." |
| FAQ - categories question (line 402) | "What insurance categories are supported?" / answer about Life, Health, Motor, General Insurance | "What industry categories are supported?" / answer about configurable categories for any industry |

## Terminology Map

- "Insurance" -> removed or replaced with "Sales" / "Field Sales"
- "Policies" -> "Deals"
- "Premium Amount" -> "Deal Value"
- "Policy Category (Life, Health, Motor, General)" -> "Category"
- Testimonial role suffixes like "Life Insurance", "Health Insurance", "General Insurance" -> removed

## Technical Details

- Single file edit: `src/pages/Landing.tsx`
- ~18 string replacements across the file
- No structural, layout, or styling changes
- No database or backend changes needed

