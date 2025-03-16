<script lang="ts">
    let { children, redtext, ...rest } = $props();
    let bold: boolean = $state(false);
    for (const key in rest) {
        const match = key.match(/\bbold\b/);
        if (match) {bold = true}
    }
</script>

{#if bold}
    <p class="warning">
        <strong>
            <span class="warning-red">{redtext}</span> 
            {@render children()}
        </strong>
    </p>
{:else}
    <p class="warning">
        <span class="warning-red">{redtext}</span> 
        {@render children()}
    </p>
{/if}

<style lang="scss">
    @import '/static/styles/vars.scss';

    .warning {
        font-family: $bodyFont;
        color: $text;
        text-align: center;
        font-size: 1.25em;
    }

    .warning-red {
        color: #ff1111;
    }
</style>