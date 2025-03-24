<script lang="ts">
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    
    interface Image {
        imageUrl: string;
        height: number;
        width: number;
    }

    let { images, mainImage }: { images: Image[], mainImage: Image | undefined } = $props();

    // export let images: Image[] = [];
    // export let mainImage: Image | undefined = undefined;

    let currentIndex: number = $state(0);
    let loading: boolean = $state(true);
    let showSpinner: boolean = $state(false);
    let spinnerTimeout: ReturnType<typeof setTimeout>;
    let dotContainer: HTMLDivElement = $state();
    let carouselWindow: HTMLDivElement = $state();
    let zoomImg: HTMLImageElement = $state();
    let isZoomed: boolean = $state(false);
    let isFocused: boolean = $state(false);
    let touchStart: number | null = null;

    let allImages = $state([]);
    let hasImages: boolean = $state(false)

    $effect(() => {
        allImages = mainImage ? [mainImage, ...images] : images;
    });
    $effect(() => {  
        hasImages = allImages.length > 0;  
    });

    // Handle dot scrolling
    $effect(() => {
        if (dotContainer && hasImages) {
            const activeDot = dotContainer.children[currentIndex] as HTMLElement;
            if (activeDot) {
                const containerWidth = dotContainer.offsetWidth;
                const dotLeft = activeDot.offsetLeft;
                const dotWidth = activeDot.offsetWidth;
                const scrollLeft = dotLeft - containerWidth / 2 + dotWidth / 2;
                
                dotContainer.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    });

    function handleTouchStart(e: TouchEvent) {
        touchStart = e.changedTouches[0].screenX;
    }

    function handleTouchEnd(e: TouchEvent) {
        if (!touchStart) return;
        
        const touchEnd = e.changedTouches[0].screenX;
        const swipeDistance = touchEnd - touchStart;
        
        if (Math.abs(swipeDistance) > 50) {
            if (swipeDistance > 0) previous();
            else next();
        }
        
        touchStart = null;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (!isFocused) return;
        if (event.key === 'ArrowLeft') previous();
        if (event.key === 'ArrowRight') next();
        if (event.key === 'Escape' && isZoomed) toggleZoom();
    }

    function handleFocus() {
        isFocused = true;
    }

    function handleBlur(event: FocusEvent) {
        if (!event.relatedTarget || 
            !(event.relatedTarget instanceof Node) || 
            !carouselWindow.contains(event.relatedTarget)) {
            isFocused = false;
        }
    }

    function toggleZoom(event?: MouseEvent) {
        if (!isZoomed && event) {
            isZoomed = true;
            handleZoomMove(event);
        } else {
            isZoomed = false;
        }
    }

    function handleZoomMove(event: MouseEvent) {
        if (!isZoomed || !zoomImg || !carouselWindow) return;

        const rect = carouselWindow.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 100;
        const y = (event.clientY - rect.top) / rect.height * 100;

        zoomImg.style.transformOrigin = `${x}% ${y}%`;
    }

    async function loadCurrentImage() {
        if (!hasImages || !browser) return;
        
        loading = true;
        showSpinner = false;
        clearTimeout(spinnerTimeout);
        isZoomed = false;
        
        spinnerTimeout = setTimeout(() => {
            if (loading) showSpinner = true;
        }, 300);

        const img = new window.Image();
        
        try {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = allImages[currentIndex].imageUrl;
            });
            
            loading = false;
            showSpinner = false;
            clearTimeout(spinnerTimeout);
            
            preloadAdjacentImages();
        } catch (error) {
            console.error('Failed to load image:', error);
            loading = false;
            showSpinner = false;
            clearTimeout(spinnerTimeout);
        }
    }
    
    async function preloadAdjacentImages() {
        if (!hasImages || !browser) return;
        
        const nextIndex = (currentIndex + 1) % allImages.length;
        const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
        
        [nextIndex, prevIndex].forEach(index => {
            const img = new window.Image();
            img.src = allImages[index].imageUrl;
        });
    }

    function next() {
        currentIndex = (currentIndex + 1) % allImages.length;
        loadCurrentImage();
    }

    function previous() {
        currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
        loadCurrentImage();
    }

    function jumpToImage(index: number) {
        currentIndex = index;
        loadCurrentImage();
    }

    function handleImageLoad() {
        loading = false;
        showSpinner = false;
        clearTimeout(spinnerTimeout);
    }

    onMount(() => {
        if (hasImages) {
            loadCurrentImage();
            window.addEventListener('keydown', handleKeydown);
        }
        return () => {
            clearTimeout(spinnerTimeout);
            window.removeEventListener('keydown', handleKeydown);
        };
    });
</script>

{#if hasImages}
    <div class="carousel-container"
         onfocusin={handleFocus}
         onfocusout={handleBlur}>
        {#if allImages.length > 1}
            <button 
                class="nav-button prev" 
                onclick={previous}
                aria-label="Previous image">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
        {/if}

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div class="carousel-window"
            bind:this={carouselWindow}
            ontouchstart={handleTouchStart}
            ontouchend={handleTouchEnd}
            onmousemove={handleZoomMove}
            onkeydown={handleKeydown}
            class:zoomed={isZoomed}
            role="region"
            aria-label="Image carousel viewer">
            {#if showSpinner}
                <div class="loading-spinner">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                </div>
            {/if}
            <button 
                class="image-container"
                onclick={toggleZoom}
                onkeydown={(e) => e.key === 'Enter' && toggleZoom()}
                aria-label={`Zoom ${isZoomed ? 'out of' : 'into'} image ${currentIndex + 1} of ${allImages.length}`}>
                <img 
                    bind:this={zoomImg}
                    src={allImages[currentIndex]?.imageUrl} 
                    alt="Product view {currentIndex + 1} of {allImages.length}"
                    class:loading
                    class:zoomed={isZoomed}
                    onload={handleImageLoad}
                />
            </button>
        </div>

        {#if allImages.length > 1}
            <button 
                class="nav-button next" 
                onclick={next}
                aria-label="Next image">
                <i class="fa-solid fa-chevron-right"></i>
            </button>

            <div class="dot-container" bind:this={dotContainer}>
                {#each allImages as _, i}
                    <button 
                        class="dot" 
                        class:active={i === currentIndex}
                        onclick={() => jumpToImage(i)}
                        aria-label="Go to image {i + 1}"
                    ></button>
                {/each}
            </div>
        {/if}
    </div>
{:else}
    <div class="carousel-container">
        <div class="carousel-window">
            <p class="body">No images available</p>
        </div>
    </div>
{/if}

<style lang="scss">
    @use 'sass:color';
    @import '/static/styles/vars.scss';
    @import '/static/styles/temutailwind.scss';

    .carousel-container {
        position: relative;
        width: 90%;
        aspect-ratio: 10 / 7;
        margin: 0 auto;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .carousel-window {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: 20px;
        box-sizing: border-box;
        cursor: zoom-in;

        &.zoomed {
            cursor: zoom-out;
        }

        img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            opacity: 1;
            transition: opacity 0.3s ease;

            &.loading {
                opacity: 0;
            }

            &.zoomed {
                transform: scale(2.5);
            }
        }
    }

    .loading-spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2rem;
        color: $accent;
        z-index: 1;
    }

    .nav-button {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background-color: rgba($accent, 0.5);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: background-color 0.1s;
        z-index: 2;

        &:hover {
            background-color: $accent;
        }

        &.prev {
            left: 10px;
        }

        &.next {
            right: 10px;
        }

        i {
            font-size: 1.2rem;
        }
    }

    .dot-container {
        $dotContainerColor: color.adjust($veryLightGrey, $blackness: 30%);
        position: absolute;
        bottom: 15px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 20px;
        padding: 8px 20px;
        overflow-x: auto;
        width: 150px;
        scrollbar-width: none;
        -ms-overflow-style: none;
        scroll-behavior: smooth;
        background-color: $dotContainerColor;
        border-radius: 20px;

        &:has(.dot:nth-child(-n+5):last-child) {
            justify-content: center;
        }
        
        &::-webkit-scrollbar {
            display: none;
        }

        &::before,
        &::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            width: 20px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
        }

        &:not(:has(.dot:nth-child(-n+5):last-child)) {
            &::before,
            &::after {
                opacity: 1;
            }
        }

        &::before {
            left: 0;
            background: linear-gradient(to right, $dotContainerColor, transparent);
            border-radius: 20px 0 0 20px;
        }

        &::after {
            right: 0;
            background: linear-gradient(to left, $dotContainerColor, transparent);
            border-radius: 0 20px 20px 0;
        }
    }

    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.5);
        border: none;
        padding: 0;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;

        &:hover {
            background-color: white;
            transform: scale(1.2);
        }

        &.active {
            background-color: white;
            transform: scale(1.2);
        }
    }

    .image-container {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        cursor: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;

        &:focus {
            outline: 2px solid $accent;
            outline-offset: 2px;
        }

        &:focus:not(:focus-visible) {
            outline: none;
        }
    }
</style>