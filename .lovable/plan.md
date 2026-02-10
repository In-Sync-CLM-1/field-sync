

## Add Logo Upload to Onboarding "Set up your company" Screen

### What changes
Add an optional logo upload field to the Company Profile section of the onboarding page (the "Set up your company" step), placed between the "Company Profile" header bar and the "Company Name" field.

### User Experience
- A clickable upload area with a dashed border, camera/upload icon, and "Upload Logo" label
- Clicking opens a file picker (images only, max 2MB)
- Once selected, a circular preview of the logo appears with a remove (X) button
- On submit, the logo is uploaded to the `org-logos` storage bucket and the organization's `logo_url` is updated -- reusing the same bucket and pattern already implemented in the Auth registration page

### Technical Details

**File: `src/pages/Onboarding.tsx`**

1. Add state variables for the logo file and preview URL (`orgLogo`, `orgLogoPreview`)
2. Add a hidden file input ref
3. Add file validation handler (images only, max 2MB)
4. Insert a logo upload UI block between the "Company Profile" bar (line 513) and the "Company Name" field (line 518):
   - Circular upload area with dashed border
   - Preview with remove button when a file is selected
5. Update `handleStep1Submit` to:
   - Upload the file to `org-logos/{orgId}/logo.{ext}` via the storage API
   - Update the organization's `logo_url` column with the public URL
   - Update the local `currentOrganization` state with the new `logo_url`

No new dependencies, migrations, or storage buckets are needed -- the `org-logos` bucket already exists with public access and authenticated upload policies.

