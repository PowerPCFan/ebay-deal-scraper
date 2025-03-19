<script lang="ts">
    import SidebarWrapper from "$lib/components/sidebarWrapper.svelte";
    import type { PageData, SearchResult } from '$lib/types.ts';
    import Tooltip from "$lib/components/tooltip.svelte";
    import { onMount } from "svelte";
    import { goto, invalidate } from "$app/navigation";

    export let data: PageData;

    let allResults: SearchResult[] = data?.results || [];

    let currentPage: number = 1; // Declare outside, initialize to a default value
    let back: () => void;
    let forward: () => void;

    let url: URL;
    let baseUrl: string;

    let width: number;

    onMount(() => {
        url = new URL(window.location.href);
        baseUrl = url.origin
        currentPage = parseInt(url.searchParams.get("page") || "1", 10);

        back = () => {
            url.searchParams.set("page", Math.max(1, currentPage - 1).toString());
            window.location.href = url.toString();
            // goto(url.toString());
            // invalidate(() => true);
        };

        forward = () => {
            url.searchParams.set("page", (currentPage + 1).toString());
            window.location.href = url.toString();
            // goto(url.toString());
            // invalidate(() => true);
        };
    })
</script>

<svelte:window bind:innerWidth={width} />

<style lang="scss">
    @import "/static/styles/style.scss";
</style>

<main id="sveltekit-body">
    <SidebarWrapper>
        {#if allResults && allResults.length > 0}
            {#each allResults as result}
                <div class="result-item">
                    <img class="thumbnail" src={result.thumbnail} alt={result.title} />
                    <div class="content">
                        <h2>
                            <a class="title-link" href={result.link} target="_blank" rel="noopener noreferrer">
                                {result.title}
                            </a>
                        </h2>
                        {#if result.type === 'FIXED_PRICE' && result.price !== 'N/A'}
                            <p>Price: ${result.price}</p>
                        {:else if result.type === 'AUCTION' && result.bidprice !== 'N/A'}
                            <p>Current Bid: ${result.bidprice} (<a class="bid-link" href="https://www.ebay.com/bfl/viewbids/{result.itemnumber}?item={result.itemnumber}">{result.bidcount} Bids</a>)</p>
                                <p>Time Remaining: {result.timeRemaining}</p>
                        {:else if result.bidprice === 'N/A' || result.price === "N/A"}
                            <p>Price: N/A (Internal Server Error)</p>
                        {:else}
                            <p>Price: N/A (Internal Server Error)</p>
                        {/if}
                        <p>Condition: {result.condition}</p>
                        <p><em>{result.shipping === 'Free' ? 'Free' : `${result.shipping}`}</em></p>
                        {#if result.type === 'FIXED_PRICE'}
                            <p>Type: Buy It Now</p>
                        {:else if result.type === 'AUCTION'}
                            <p>Type: Auction</p>
                        {:else}
                            <p>Type: {result.type}</p>
                        {/if}

                        <p>Seller: {result.sellerName} &lpar;
                            <Tooltip
                                title="Feedback Score" 
                                text="eBay Feedback Score is another way to check the credibility of a seller, instead of the positive review percentage. <br><br>
                            Here's how it works: <br>
                                - If a buyer leaves a positive review, it adds +1 point to the Credibility Score.<br>
                                - Neutral reviews don't add or remove any points so the score stays the same.<br>
                                - Negative reviews take away -1 point.<br><br>
                            However, this is not as accurate of a measurement for smaller sellers, because a seller with a lower credibility score might still be credible, and they just don't have as many reviews/feedback yet." 
                                fontsize="1rem"
                                questionmark
                            >{result.feedbackScore}
                            </Tooltip>&rpar; ({result.feedbackPercentage}% positive reviews)
                        </p>
                    </div>
                </div>
            {/each}
        {:else}
            <p>No results found</p>
        {/if}
    </SidebarWrapper>

    <div class="pagination">
        {#if currentPage > 1}
        <button on:click={back} aria-label="Previous Page"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i>&nbsp;&nbsp;Back</button>
        {/if}
        <button on:click={forward} aria-label="Next Page">Forward&nbsp;&nbsp;<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
    </div>
</main>