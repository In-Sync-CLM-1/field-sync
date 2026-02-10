
# Make Daily Plan Creation More Obvious

## Problem
The Daily Planning page has all the functionality to create a plan, but the "Submit" button is small (h-6) and placed at the very bottom of the form, making it hard to discover. First-time users don't realize they need to fill in the target numbers and scroll down to submit.

## Solution
Make the plan creation flow more intuitive with these changes:

### 1. Add a Prominent "Create Today's Plan" Call-to-Action (when no plan exists)
When there's no plan for the selected date, show a highlighted banner/card above the target table with a clear message like:
- "Set Your Targets for Today" with a brief instruction: "Enter your Prospects, Quotes, and Sales targets below, then tap Save Plan"
- Use the brand's primary color to draw attention

### 2. Make the Submit/Save Button More Prominent
- Increase button size from `h-6` to `h-9` (standard button height)
- Make it full-width when creating a new plan
- Use clear label: "Save Plan" (instead of "Submit")
- Add a `PlusCircle` icon when creating, `Save` icon when updating
- Use a success/primary color accent so it stands out

### 3. Show an Empty State Guide (when no plan exists for the date)
Before the user enters any targets, highlight the input fields with a subtle pulsing border or accent color to guide attention to them.

---

## Technical Details

### File: `src/pages/Planning.tsx`

**Changes to the Agent View section (lines 444-853):**

1. Add a motivational banner above the Target vs Achievement card when `!plan`:
```tsx
{!plan && !isLoading && (
  <Card className="border-primary/30 bg-primary/5">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="icon-circle icon-circle-primary h-10 w-10 shrink-0">
        <Target className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          Set Your Targets for {format(selectedDate, 'MMM d, yyyy')}
        </p>
        <p className="text-xs text-muted-foreground">
          Enter your Prospects, Quotes & Sales targets below and tap Save Plan
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

2. Update the Submit button (lines 826-835) to be larger and more prominent:
```tsx
<div className="mt-3">
  <Button 
    size="default"
    className="w-full h-9 text-sm font-medium gap-2"
    type="submit"
    disabled={createPlan.isPending || updatePlan.isPending}
  >
    {plan ? (
      <>
        <CheckCircle className="h-4 w-4" />
        Update Plan
      </>
    ) : (
      <>
        <PlusCircle className="h-4 w-4" />
        Save Plan
      </>
    )}
  </Button>
</div>
```

3. Import `PlusCircle` from lucide-react (add to existing import on line 4).

### Summary of Changes
- **1 file modified**: `src/pages/Planning.tsx`
- Adds a guidance banner when no plan exists for the selected date
- Makes the Save/Submit button full-width and larger with an icon
- No database or backend changes needed
