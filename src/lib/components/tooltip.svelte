<!-- <script lang="ts">
    let { children, text, title, fontsize, ...rest } = $props();
    let questionmark: boolean = $state(false);

    for (const question in rest) {
        const regex: RegExp = /questionmark/i;
        const match = question.match(regex);
        if (match) {
            questionmark = true;
        }
    }
</script>

<span class="tooltip">
    {@render children()}
    {#if questionmark}
    <sup class="tooltip-questionmark">?</sup>
    {/if}
    <span style="font-size: {fontsize};" class="tooltiptext"><b>{title}</b>
        <br><br>
        {@html text}
    </span>
</span>

<style lang="scss">
    @import '/static/styles/vars.scss';

// TOOLTIPS
// To use tooltips, find the element you want to have the tooltip show next to.
// Set that element's CLASS to "tooltip". 
// The tooltip text can be placed in a <span> with class "tooltiptext". 

@keyframes fadeIn {
    0% {opacity: 0%;}
    25% {opacity: 25%;}
    50% {opacity: 50%;}
    75% {opacity: 75%;}
    100% {opacity: 100%;}
}

@keyframes fadeOut {
    100% {opacity: 100%;}
    75% {opacity: 75%;}
    50% {opacity: 50%;}
    25% {opacity: 25%;}
    0% {opacity: 0%;}
}

.tooltip {
    position: relative;
    display: inline-block;
    text-decoration: underline dotted $text 1.75px;

    &:hover {
        cursor: help;
        .tooltiptext {
            animation: fadeIn 0.25s; // No idea why I used keyframes when I probably didn't have to lol
            visibility: visible;
            opacity: 100%;
        }
    }
    
    .tooltip-questionmark {
        color: #444444; 
        text-decoration: none;
    }

    .tooltiptext {
        visibility: hidden;
        opacity: 0%;
        width: 240px;
        background-color: $veryLightGrey;
        color: $text;
        text-align: center;
        border-radius: 12px;
        border: 3px solid $accent;
        padding: 18px;
        position: absolute;
        z-index: 1;
        top: -5px;
        left: 110%;
        font-family: $bodyFont;
    
        &::after {
            content: "";
            position: absolute;
            top: 5%; // height of the arrow (idk if i'm adjusting this in the right place but it works!)
            right: 100%;
            margin-top: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: transparent black transparent transparent;
        }
    }
}
</style> -->



<script lang="ts">
    let { children, text, title, fontsize, ...rest } = $props();
    let questionmark: boolean = $state(false);

    for (const question in rest) {
        const regex: RegExp = /questionmark/i;
        const match = question.match(regex);
        if (match) {
            questionmark = true;
        }
    }
</script>

<span class="tooltip">
    {@render children()}
    {#if questionmark}
    <sup class="tooltip-questionmark">?</sup>
    {/if}
    <span style="font-size: {fontsize};" class="tooltiptext">
        <b>{title}</b>
        <br><br>
        {@html text}
    </span>
</span>

<style lang="scss">
    @import '/static/styles/vars.scss';

    @keyframes fadeIn {
        0% {opacity: 0%;}
        25% {opacity: 25%;}
        50% {opacity: 50%;}
        75% {opacity: 75%;}
        100% {opacity: 100%;}
    }

    .tooltip {
        position: relative;
        display: inline-block;
        text-decoration: underline dotted $text 1.75px;

        &:hover {
            cursor: help;
            .tooltiptext {
                animation: fadeIn 0.25s;
                visibility: visible;
                display: inline-block;
                opacity: 100%;
            }
        }
        
        .tooltip-questionmark {
            color: #444444; 
            text-decoration: none;
        }

        .tooltiptext {
            visibility: hidden;
            display: none;
            opacity: 0%;
            width: 240px;
            background-color: $veryLightGrey;
            color: $text;
            text-align: center;
            border-radius: 12px;
            border: 3px solid $accent;
            padding: 18px;
            position: absolute;
            z-index: 1;
            font-family: $bodyFont;

            @media screen and (min-width: $breakpoint) {
                // Desktop behavior (original)
                top: -5px;
                left: 110%;

                &::after {
                    content: "";
                    position: absolute;
                    top: 5%;
                    right: 100%;
                    margin-top: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: transparent $accent transparent transparent;
                }
            }

            @media screen and (max-width: #{$breakpoint - 1}) {
                // Mobile centered behavior
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: min(240px, 80vw);

                &::after {
                    display: none; // Hide arrow on mobile
                }
            }
        }
    }
</style>