

# Add Help Widget Script to index.html

## Change

Add the external help widget script to `index.html` just before the closing `</body>` tag:

```html
<script src="https://go-in-sync.lovable.app/help-widget.js" data-source="field_force_automation"></script>
```

## Technical Details

### File: `index.html`
- Add the script tag before the closing `</body>` tag, after the existing module script for `main.tsx`
- The script loads an external help widget with `data-source="field_force_automation"` configuration

Single-line addition to one file.

