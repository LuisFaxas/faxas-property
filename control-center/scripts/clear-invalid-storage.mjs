/**
 * Script to generate client-side code for clearing invalid projectIds from localStorage
 */

console.log(`
=== CLEAR INVALID PROJECT ID ===

If you're seeing errors about invalid project IDs, run this in your browser console:

localStorage.removeItem('selectedProjectId');
location.reload();

This will clear the stale project ID and reload the page with a valid one.
`);
