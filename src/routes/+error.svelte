<!-- Dog Version -->
<!-- <svelte:options runes={true} />
<script lang="ts">
    import { page } from '$app/state';
    import { onMount } from 'svelte';

    let url: URL;
    let baseUrl: string;

    const fallbackImages = ['/static/dog/dog1.jpg', '/static/dog/dog2.jpg', '/static/dog/dog3.jpg'];
    let dogImage: string = $state(fallbackImages[Math.floor(Math.random() * fallbackImages.length)]);

    async function fetchDogImage() {
        try {
            const response = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await response.json();
            
            if (data.status === 'success') { dogImage = data.message; }
        } catch {}
    }; fetchDogImage();

    onMount(async () => {
        url = new URL(window.location.href);
        baseUrl = url.origin;
    })
</script>
    
<div class="container">
    {#if page.status === 404}
        <h1>Error 404: {page.error.message}</h1>
        <p>This page doesn't exist! Are you lost?</p>
        <button class="image-button" onclick={() => window.location.href = baseUrl}>Click me to go home!<br>
            <img src="{dogImage}" alt="Randomly generated image of a dog">
        </button>
    {:else}
        <h1>Error {page.status}</h1>
        <p>{page.error.message}</p>
    {/if}
</div>

<style lang="scss">
    @use 'sass:color';
    @import '/static/styles/vars.scss';

    $margin: 5px;
    $size: 175;

    .container {
        font-family: $bodyFont;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        width: auto;
        height: 100%;
        min-width: 95vw;
        min-height: 95vh;

        h1 {
            margin-top: $margin;
            margin-bottom: $margin;
            font-size: calc($size * 1%);
        }
    }

    p {
        margin-top: $margin;
        margin-bottom: $margin;
        font-size: calc($size * 1%);
    }


    .image-button {
        margin-top: 1rem;
        position: relative;
        padding: 10px;
        background: none;
        border: none;
        outline: 2px solid color.adjust(#000000, $lightness: 80%);
        transition: outline 0.15s ease;
        cursor: pointer;
        text-align: center;
        font-family: $bodyFont;
        font-size: calc(#{$size - 35 } * 1%);
        color: inherit;

        &:hover {
            cursor: pointer;
            outline: 2px solid black;
        }

        img {
            display: block;
            margin-top: 5px;
            margin-left: auto;
            margin-right: auto;
            max-width: 600px;
            height: auto;
            object-fit: contain;
        }
    }
</style> -->


<!-- Regular version, no dogs -->
<svelte:options runes={true} />
<script lang="ts">
    import { page } from '$app/state';
    import { onMount } from 'svelte';
</script>
    
<div class="container">
    <h1>Error {page.status}</h1>
    <p>{page.error.message}</p>
</div>

<style lang="scss">
    @use 'sass:color';
    @import '/static/styles/vars.scss';

    $margin: 5px;
    $size: 175;

    .container {
        font-family: $bodyFont;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        width: auto;
        height: 100%;
        min-width: 95vw;
        min-height: 95vh;

        h1 {
            margin-top: $margin;
            margin-bottom: $margin;
            font-size: calc($size * 1%);
        }
    }

    p {
        margin-top: $margin;
        margin-bottom: $margin;
        font-size: calc($size * 1%);
    }
</style>