<script lang="ts">
    // Vercel Analytics
    import { injectAnalytics } from '@vercel/analytics/sveltekit' 
    injectAnalytics()

    // Props
    let { children } = $props();
</script>

<!-- Commented out because slot is deprecated in Runes Mode -->
<!-- <slot /> -->

<!-- Use @render children() with $props instead -->
{@render children()}