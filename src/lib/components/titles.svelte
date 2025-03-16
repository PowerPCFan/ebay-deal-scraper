<script lang="ts">
    // Destructure known props and capture the rest in "rest"
    let { children, large = false, medium = false, small = false, style = '', ...rest } = $props();
    
    // Default size (medium)
    let size = $state("48px");
    if (large) {
        size = "70px";
    } else if (medium) {
        size = "48px";
    } else if (small) {
        size = "32px";
    }
    
    // Look for any prop that matches the custom pattern (e.g., custom-120px)
    for (const key in rest) {
        const match = key.match(/^custom-(\d+)px$/);
        if (match) {
            size = `${match[1]}px`;
        }
    }
</script>
  
<style lang="scss">
    @import '/static/styles/vars.scss';
    .titles {
        font-family: $headingFont;
        text-align: center; 
        color: $text;
    }
</style>
  
<h1 class="titles" style="font-size: {size}; {style}">
    {@render children()}
</h1> 