<script lang="ts">
    import { page } from '$app/state';
    import { browser } from '$app/environment';
    import SidebarWrapper from "$lib/components/sidebarWrapper.svelte";
    import ImageCarousel from "$lib/components/ImageCarousel.svelte";
    import { onMount } from 'svelte';

    // export let data: { item: any };
    // const { item } = data;

    let { data } = $props();
    let { item }: { item: any } = data;

    let width: number = $state();

    let sellerUrl: string = $state(`https://www.ebay.com/sch/i.html?_ssn=${item.sellerName}`);
    let quantity: string = $state("1");
    let biddingEnded: boolean = $state();

    let itemId: string;
    $effect(() => { itemId = page.params.id });

    $effect(() => { quantity = quantity.replace(/[^\d]/g, "") });

    function validateQuantity() {
        if (quantity === "") {
            quantity = "1";
            return;
        }

        const num = parseInt(quantity) || 1;
        if (num > item.remainingquantity) {
            quantity = item.remainingquantity.toString();
        }

        quantity = quantity.replace(/^0+/, '') || "1";
    }

    function buyItem() {
        if (!browser) return;

        const buyUrl = `https://pay.ebay.com/rxo?action=create&rypsvc=true&pagename=ryp&item=${itemId}&quantity=${quantity}&TransactionId=-1`;
        // window.location.href = buyUrl;
        window.open(buyUrl, '_blank');
    }

    onMount(() => {
        biddingEnded = item.timeRemaining === "0s" && item.auction ? true : false;
    });
</script>
<svelte:window bind:innerWidth={width} />

{#if item.hasVariations}
    <div class="variations">
        <h1 class="heading">Listings with variations are not yet supported. Sorry for the inconvenience!</h1>
        <a class="heading" target="blank_" href={item.link}>Click this link to view the item on eBay. </a>
    </div>
{:else}
    <main class="sveltekit-body">
        <SidebarWrapper title="" searchbar>
            <div class="container">
                <div class="image">
                    <ImageCarousel 
                        mainImage={item.image}
                        images={item.additionalImages || []}
                    />
                </div>
                <div class="information">
                    <h2 class="item-title bodyFontHeading">
                        <strong>
                            {item.title}
                        </strong>
                        <a href="{item.link}" target="_blank" aria-label="Open Listing on eBay">
                            <abbr title="Open Listing on eBay">
                                <span class="material-symbols-outlined">
                                    open_in_new
                                </span>
                            </abbr>
                        </a>
                    </h2>
                    <hr class="lightenhr m1r">
                    <p class="body">
                        <span class="block" style="margin-bottom: 5px;">
                            Seller: 
                            <a href={sellerUrl} target="_blank" class="body">{item.sellerName}</a> 
                            &lpar;{item.feedbackScore}&rpar;
                        </span>
                        {item.feedbackPercentage}% positive reviews
                    </p>
                    <hr class="lightenhr m1r">
                    <!-- availability possible values: [IN_STOCK,LIMITED_STOCK,OUT_OF_STOCK] -->
                    {#if item.availability === "OUT_OF_STOCK" || item.remainingquantity < 1}
                        <div class="price">Out Of Stock</div>
                    {:else}
                        <div class="price">${item.price}</div>
                    {/if}
                    {#if item.auction && !item.buyitnow}
                    <div class="body m05r-t">
                        <a 
                          class="bid-link"
                          target="_blank"
                          href="https://www.ebay.com/bfl/viewbids/{item.itemnumber}?item={item.itemnumber}"
                          >{item.bidcount} Bids
                        </a>
                        &#x2022; 
                        {#if !biddingEnded}
                        Ends in {item.timeRemaining}
                        {/if}
                        {#if biddingEnded}
                        Bidding Ended
                        {/if}
                    </div>
                    {/if}
                    <hr class="lightenhr m1r">
                    <div class="body">Condition: <strong>{item.condition}</strong></div>
                    <div class="body m05r-t">Quantity: 
                        <input 
                            type="text" 
                            inputmode="numeric" 
                            class="quantity-input" 
                            bind:value={quantity}
                            onblur={validateQuantity}
                        >
                        {item.remainingquantity} available &#x2022; {item.soldquantity} sold
                    </div>

                    {#if !biddingEnded}
                    <hr class="lightenhr m1r">
                    {/if}

                    {#if item.buyitnow && !item.auction}
                    <div class="buy-container">
                        <button class="buy-button" onclick={buyItem}>Buy It Now (via eBay)</button>
                    </div>
                    {:else if !item.buyitnow && item.auction && !biddingEnded}
                    <div class="body ta-center"><em><a target="_blank" href="{item.link}">To place a bid, please visit the eBay page.</a></em></div>
                    {/if}
                    {#if item.bestoffer && !biddingEnded}
                    <div class="body ta-center m05r-t"><em><a target="_blank" href="{item.link}">To place an offer, please visit the eBay page.</a></em></div>
                    {/if}
                    <hr class="lightenhr m1r">

                    <div class="body">Shipping: <strong>{item.shipping}</strong> &#x2022; {item.shippingService}</div>
                    <div class="body m05r-t">Located in: {item.city}, {item.state}, {item.country}</div>
                </div>
            </div>
            {#if width < 816}
            <hr class="lightenhr">
            {/if}
            <div class="description">
                <div class="desc-title bodyFontHeading m05r-b"><strong>Item Details and Description:</strong></div>
                <div class="body">{@html item.description}</div>
            </div>
        </SidebarWrapper>
    </main>
{/if}

<style lang="scss">
    @import '/static/styles/vars.scss';
    @import '/static/styles/temutailwind.scss';

    .buy-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
    }

    .buy-button {
        white-space: nowrap;
        outline: none;
        border: none;
        font-family: $bodyFont;
        background-color: $primary;
        color: $background;
        margin: 0 auto;
        font-size: 1.4rem;
        width: 90%;
        height: 50px;
        border-radius: 50px;
        transition: background-color 0.25s ease, color 0.25s ease, border 0.25s ease;
    
        &:hover {
            background-color: $secondary;
            color: $text;
            cursor: pointer;
            border: 2px solid rgba($text, 1);
        }
    }

    .variations {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        flex-direction: column;
        width: auto;
        height: 100%;
        min-width: 95vw;
        min-height: 95vh;

        h1 {
            font-size: 2.5rem;
        }

        a, p {
            font-size: 2rem;
        }
    }

    .container {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        padding: 1rem;
        width: auto;
        justify-content: center;
        align-items: start;
    }

    @media (max-width: #{$breakpoint - 1}) {
        .container {
            flex-direction: column;
        }

        .image {
            flex: 1.2;
        }
    }

    .image { // flexbox to left inside .container - contains the image carousel
        flex: 1.4;
        min-width: 0;
        max-width: 1000px;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
            max-width: 100%;
            height: auto;
            object-fit: contain;
        }
    }

    .information { // element to the right inside .container - contains info about the item
        flex: 1;
        min-width: 200px;
        max-width: 700px;
        
        .item-title {
            font-size: 1.625rem;
        }

        .price {
            font-family: $bodyFont;
            font-size: 1.625rem;
            font-weight: bold;
        }
    
        .quantity-input {
            width: 50px;
            font-family: $bodyFont;
        }
    }

    .description { // item description - below .container
        overflow-x: scroll;
        padding: 1rem;
        max-width: 99svw;

        .desc-title {
            font-size: 1.625rem;
        }
    }
</style>