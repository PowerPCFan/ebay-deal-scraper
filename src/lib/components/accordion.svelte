<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    
    // Props
    let { 
        title, 
        iconClass = "fa-solid fa-chevron-right", 
        initiallyOpen = false, 
        children,
        ...rest 
    } = $props();

    // State
    let isOpen: boolean = $state(initiallyOpen);
    let contentElement: HTMLElement = $state();
    let innerContentElement: HTMLElement = $state();
    let iconElement: HTMLElement = $state();
    let accordionId = $state(`accordion-${Math.random().toString(36).substring(2, 10)}`);
    let accordionWidth: string | null = $state(null);
    let resizeObserver: ResizeObserver | null = $state(null);
    let uniqueStyleId = $state(`accordion-style-${Math.random().toString(36).substring(2, 10)}`);

    // Extract width from rest props if it exists
    for (const key in rest) {
        if (key.match(/^width$/i)) {
            accordionWidth = rest[key];
        }
    }

    function toggleAccordion() {
        isOpen = !isOpen;
        
        if (isOpen) {
            // Open the accordion
            if (iconElement) iconElement.style.transform = "rotate(90deg)";
            if (contentElement) {
                contentElement.classList.add("active");
                adjustAccordionHeight();
            }
        } else {
            // Close the accordion
            if (contentElement) {
                contentElement.style.maxHeight = "0";
                contentElement.classList.remove("active");
            }
            if (iconElement) iconElement.style.transform = "rotate(0deg)";
        }
    }

    function adjustAccordionHeight() {
        if (isOpen && contentElement) {
            contentElement.style.maxHeight = `${contentElement.scrollHeight}px`;
        } else if (contentElement) {
            contentElement.style.maxHeight = "0";
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleAccordion();
        }
    }
    
    onMount(() => {
        // Initial setup
        if (isOpen && contentElement) {
            iconElement.style.transform = "rotate(90deg)";
            contentElement.classList.add("active");
            adjustAccordionHeight();
        }
        
        // Setup resize observer
        if (innerContentElement) {
            resizeObserver = new ResizeObserver(() => {
                if (isOpen) {
                    adjustAccordionHeight();
                }
            });
            
            resizeObserver.observe(innerContentElement);
        }
    });
    
    // Cleanup on component destroy
    onDestroy(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
    });

    // Export a public function to toggle the accordion from outside
    export function toggle() {
        toggleAccordion();
    }
</script>

<div id={uniqueStyleId} class="accordion" style={accordionWidth ? `width: ${accordionWidth};` : ''}>
    <div 
        class="accordion-title" 
        style={accordionWidth ? `width: ${accordionWidth};` : ''}
        onclick={toggleAccordion}
        onkeydown={handleKeyDown}
        role="button"
        tabindex="0"
        aria-expanded={isOpen}
        aria-controls={accordionId}
    >
        <i class={iconClass} bind:this={iconElement} aria-hidden="true"></i>
        <span>{title}</span>
    </div>
    <div 
        id={accordionId}
        class="accordion-content" 
        bind:this={contentElement}
        style="max-height: 0;"
        role="region"
        aria-labelledby={`${accordionId}-header`}
    >
        <div class="accordion-inner" bind:this={innerContentElement}>
            {@render children()}
        </div>
    </div>
</div>

<style lang="scss">
    @import '/static/styles/vars.scss';

    .accordion {
        display: flex;
        flex-direction: column;
        color: $text;
        width: 100%; /* Default width, can be overridden */
        margin-inline: auto;
        font-family: $bodyFont;
    
        .accordion-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%; /* Default to full width */
            padding: 1em;
            cursor: pointer;
            user-select: none;
            margin-top: 0.6rem;
            border-bottom: black solid 2px;
            border-top: black solid 2px;
            box-sizing: border-box;
    
            &:focus {
                outline: none;
            }
            
            &:focus-visible {
                outline: 2px solid #4d90fe;
                outline-offset: 2px;
            }
    
            i {
                transition: transform 0.3s ease-in-out;
            }
        }
    
        .accordion-content {
            overflow: hidden;
            transition: max-height 0.3s ease-out;
            background-color: $background;
            width: 100%; /* Full width of parent */
    
            .accordion-inner {
                padding: 0rem 1rem 1rem;
                width: 100%;
                box-sizing: border-box;
            }
        }
    }
</style>