<script lang="ts">
    import Titles from './../lib/components/titles.svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import Tooltip from '$lib/components/tooltip.svelte';
    import Warning from '$lib/components/warning.svelte';
    import Accordion from '$lib/components/accordion.svelte';

    let width: number = $state();

    let searchQuery: string = $state("");
    let exclusions: string = $state("")
    let filterAuction: boolean = $state(true);
    let filterBuyItNow: boolean = $state(true);
    let sortBy: string = $state('best-match');
    let pageNumber: number = 1;
    let minPrice: string = $state("");
    let maxPrice: string = $state("");
    let loading: boolean = $state(false);
    let condition: string = $state("");

    $effect(() => {
        exclusions = exclusions
        .replace(/[^a-zA-Z, ]/g, "")           // Allow only lowercase letters and commas
        .replace(/\s{2,}/g, " ")            // Replace consecutive spaces with a single space
        .replace(/,{2,}/g, ",")             // Prevent consecutive commas
        .replace(/,\s{2,}/g, ", ")          // Prevent ",  , " (comma + multiple spaces)
        .replace(/(,)\1+/g, ",");           // Prevent consecutive commas (like , , ,)
    });

    function buildConditionString() {
        const conditionIds = Array.from(document.querySelectorAll('.condition-box:checked') as NodeListOf<HTMLInputElement>)
            .map(box => box.getAttribute('data-id'))
            .filter(id => id !== null && id !== "")
            .join('|');    
        const condition = conditionIds.replace(/\|{2,}/g, '|');
        // console.log(`[Client] Debug: Condition String: ${condition}`)
        return condition
    }

    function handleSubmit() {
        searchQuery === ''
        if (searchQuery === '') { 
            alert(`Error: no search query entered.`)
            // console.log(`Exclusions: ${exclusions}`)
        } else { 
            pageNumber = 1; // Reset page number on new search
            loading = true;

            let filter = '';
            if (filterAuction === filterBuyItNow) {
                filter = 'all';
            } else if (filterAuction) {
                filter = 'auction';
            } else if (filterBuyItNow) {
                filter = 'buy-it-now';
            }


            // Build the condition string during form submission
            condition = buildConditionString();
            
            const queryParams = new URLSearchParams({
                search: searchQuery,
                exclude: exclusions,
                filter: filter,
                sort: sortBy,
                page: pageNumber.toString(),
                minPrice: minPrice,
                maxPrice: maxPrice,
                condition: condition,
            }).toString();
             
            goto(`/results?${queryParams}`);
            // console.log('[Client] Debug: Navigating to results page:', `/results?${queryParams}`);
        }
    }

    function handleSubmitEnter(kbdevent: KeyboardEvent) {
        if (kbdevent.key === "Enter") {
            handleSubmit()
        }
    }

    onMount(() => {
        let isFiltersAccordionOpen = false;
        const filtersAccordionTitle = document.querySelector("#section-title-filters");
        const filtersAccordionContent = document.querySelector("#section-content-filters") as HTMLElement;
        const filtersAccordionIcon = document.querySelector("#filters-accordion-chevron") as HTMLElement;

        if (filtersAccordionTitle && filtersAccordionContent && filtersAccordionIcon) {
            const adjustAccordionHeight = () => {
                if (isFiltersAccordionOpen) {
                    filtersAccordionContent.style.maxHeight = `${filtersAccordionContent.scrollHeight}px`;
                } else {
                    filtersAccordionContent.style.maxHeight = "0";
                }
            };

            filtersAccordionTitle.addEventListener("click", () => {
                isFiltersAccordionOpen = !isFiltersAccordionOpen;

                if (isFiltersAccordionOpen) {
                    filtersAccordionIcon.style.transform = "rotate(90deg)";
                    filtersAccordionContent.classList.add("active");
                } else {
                    filtersAccordionIcon.style.transform = "rotate(0deg)";
                    filtersAccordionContent.classList.remove("active");
                }

                adjustAccordionHeight();
            });

            const resizeObserver = new ResizeObserver(() => {
                if (isFiltersAccordionOpen) {
                    adjustAccordionHeight();
                }
            });

            resizeObserver.observe(document.querySelector("#text-filters") as HTMLElement); // resize accordion if height changes

        } else {console.error(`[Client] Debug: DOM Elements for accordion "Search Filters" not found`)}
       

        // checkbox shit 2.0
        function updateMainCheckboxState(mainCheckbox: HTMLInputElement, subCheckboxes: NodeListOf<HTMLInputElement>) {
            const checkedCount = Array.from(subCheckboxes).filter(checkbox => checkbox.checked).length;

            if (checkedCount === subCheckboxes.length) {
                mainCheckbox.checked = true;
                mainCheckbox.indeterminate = false;
            } else if (checkedCount === 0) {
                mainCheckbox.checked = false;
                mainCheckbox.indeterminate = false;
            } else {
                mainCheckbox.checked = false;
                mainCheckbox.indeterminate = true;
            }
        }

        function setupCheckboxSync(mainId: string, subClass: string) {
            const mainCheckbox = document.getElementById(mainId) as HTMLInputElement;
            const subCheckboxes = document.querySelectorAll<HTMLInputElement>(subClass);

            if (!mainCheckbox) return;

            mainCheckbox.addEventListener('change', () => {
                subCheckboxes.forEach(checkbox => {
                checkbox.checked = mainCheckbox.checked;
                });
            });

            subCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => updateMainCheckboxState(mainCheckbox, subCheckboxes));
            });
        }

        setupCheckboxSync('new-condition', '.other-new-condition');
        setupCheckboxSync('refurbished-condition', '.other-refurbished-condition');
        setupCheckboxSync('used-condition', '.other-used-condition');

        document.querySelectorAll('.condition-box').forEach(box => {
            if (box.id !== 'notworking-condition') {
                (box as HTMLInputElement).checked = true;
            }
        });

        // Checkbox Accordions
        const carets = document.getElementsByClassName("condition-accordion-caret");
        let index;
        for (index = 0; index < carets.length; index++) {
            carets[index].addEventListener("click", function(this: HTMLElement) {
                // const panel = this.nextElementSibling as HTMLElement;
                let panel = this.nextElementSibling as HTMLElement | null;
                while (panel && !panel.classList.contains("panel")) {
                    panel = panel.nextElementSibling as HTMLElement | null;
                }

                if (panel && panel.style.display === "block") {
                    panel.style.display = "none";
                    this.style.transform = "rotate(0deg)"
                } else {
                    panel.style.display = "block";
                    this.style.transform = "rotate(180deg)"
                }
            });
        }

        
    }); // onMount closing brace
</script>

<svelte:window bind:innerWidth={width} />

<main class="sveltekit-body">
    {#if width >= 816}
    <Titles large>eBay Deal Scraper</Titles>
    {:else}
    <Titles custom-58px>eBay Deal Scraper</Titles>
    {/if}   
    <Warning bold redtext="IMPORTANT:">
        This site is in alpha&semi; features may be broken. Report issues or request features with <a href="https://docs.google.com/forms/d/e/1FAIpQLScuZlY43CYsrOHs-bKopbHylZT2hW9HrDU7vsNBifN6OdAkjw/viewform?usp=dialog">this form.</a>
    </Warning>

    <div class="input-container">
        <label for="search">Search:</label>
        <div class="search-row">
        <input 
            type="text"
            id="search" 
            bind:value={searchQuery}
            oninput={() => console.log('📝 [Client] Debug: Search query updated:', searchQuery)} 
            onkeydown={handleSubmitEnter}
            placeholder="Enter search query..." />
            <button type="submit" class="searchbutton" onclick={handleSubmit}>Search</button>
        </div>
        <Accordion width="min(635px, 80vw)" title="Search Filters">
            <div id="text-filters">
                <br>
                <!-- <label class="block" for="exclusions"><span class="tooltip">Exclude Words<sup class="tooltip-questionmark">?</sup>: <span class="tooltiptext"><b>Exclude Words</b><br><br>Word exclusion lets you filter out results containing a certain word. <br><br>For instance, if you are searching for something and you don't want results that contain the word "box", you can type the word "box" into the Exclude Words box to remove all results containing the word box. <br><br>You can enter one word or multiple words. <br><br><strong>NOTE:</strong> This feature will only work properly if you separate words using commas. For example: <code>box, backplate, not working, for parts</code><br><br><strong>You can easily insert commas by pressing space on your keyboard.</strong></span></span></label>  -->
                <label class="block"><Tooltip fontsize="1rem" questionmark title="Exclude Words" text="Word exclusion lets you filter out results containing a certain word. <br><br>For instance, if you are searching for something and you don't want results that contain the word &quot;box&quot;, you can type the word &quot;box&quot; into the Exclude Words box to remove all results containing the word box. <br><br>You can enter one word or multiple words. <br><br><strong>NOTE:</strong> This feature will only work properly if you separate words using commas. For example: <code>box, backplate, not working, for parts</code>">Exclude Words</Tooltip></label>
                <input class="body block" type="text" id="exclusions" bind:value={exclusions} oninput={() => console.log('📝 [Client] Debug: Search Exclusions updated:', exclusions)} 
                placeholder="Enter words to exclude...">
                <br>
                <label for="listing-type">Listing Type:</label>
                <div id="listing-type">
                    <label>
                        <input class="listingtypecheckboxes" type="checkbox" bind:checked={filterAuction}>
                        Auction
                    </label>
                    <br>
                    <label>
                        <input class="listingtypecheckboxes" type="checkbox" bind:checked={filterBuyItNow}>
                        Buy It Now
                    </label>
                </div>
        
                <label class="block" for="sort" style="margin-top: 15px !important;">Sort By:</label>
                <select class="body block" id="sort" bind:value={sortBy} onchange={() => console.log('📊 [Client] Debug: Sort changed to:', sortBy)}>
                    <option value="best-match">Best Match</option>
                    <option value="price">Price + Shipping (lowest to highest)</option>
                    <option value="-price">Price + Shipping (highest to lowest)</option>
                    <option value="newly-listed">List Time (new to old)</option>
                    {#if filterAuction && !filterBuyItNow}
                        <option value="end-time">Auction End Time</option>
                    {/if}
                </select>
        
                <label class="block" for="minPrice" style="margin-top: 15px !important;">Min Price:</label>
                <input class="body block" type="number" id="minPrice" bind:value={minPrice} placeholder="Enter min price">
        
                <label class="block" for="maxPrice" style="margin-top: 15px !important;">Max Price:</label>
                <input class="body block" type="number" id="maxPrice" bind:value={maxPrice} placeholder="Enter max price">
                
                <br>
                <label for="condition-boxes">Item Conditions:</label>
                <div id="condition-boxes">

                    <label> <!-- "New" checkbox - Category -->
                        <input type="checkbox" id="new-condition" class="condition-box" data-id="1000">
                        New&nbsp;&nbsp;
                    </label><div class="fa-solid fa-caret-down condition-accordion-caret inline-block"></div>
                    <br>
                    <div class="panel">
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-new-condition" data-id="1500">
                            Open Box
                        </label>
                        <br>
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-new-condition" data-id="1750">
                            New (with defects)
                        </label>
                        <br>
                    </div>

                    <label> <!-- "Refurbished" checkbox - Category -->
                        <input type="checkbox" id="refurbished-condition" class="condition-box" data-id="">
                        Refurbished&nbsp;&nbsp;
                    </label><div class="fa-solid fa-caret-down condition-accordion-caret inline-block"></div>
                    <br>
                    <div class="panel">
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-refurbished-condition" data-id="2000">
                            Certified Refurbished
                        </label>
                        <br>                    
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-refurbished-condition" data-id="2010">
                            Excellent - Refurbished
                        </label>
                        <br>                    
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-refurbished-condition" data-id="2020">
                            Very Good - Refurbished
                        </label>
                        <br>                    
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-refurbished-condition" data-id="2030">
                            Good - Refurbished
                        </label>
                        <br>                    
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-refurbished-condition" data-id="2500">
                            Refurbished by Seller
                        </label>
                        <br>
                    </div>

                    <label> <!-- "Used" checkbox - Category -->
                        <input type="checkbox" id="used-condition" class="condition-box" data-id="">
                        Used&nbsp;&nbsp;
                    </label><div class="fa-solid fa-caret-down condition-accordion-caret inline-block"></div>
                    <br>
                    <div class="panel">
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-used-condition" data-id="2750">
                            Used - Like New
                        </label>
                        <br>                    
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-used-condition" data-id="2990|3000">
                            Used - Excellent
                        </label>
                        <br>                    
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-used-condition" data-id="3010|4000">
                            Used - Very Good
                        </label>
                        <br>                    
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-used-condition" data-id="5000">
                            Used - Good
                        </label>
                        <br>                    
                        <label>
                            <input type="checkbox" class="condition-box indented-condition-box other-used-condition" data-id="6000">
                            Used - Fair
                        </label>
                        <br>
                    </div>

                    <label>
                        <input type="checkbox" id="notworking-condition" class="condition-box" data-id="7000">
                        For parts or not working
                    </label>
                    <br>                
                </div>
            </div>
        </Accordion>

        {#if loading}
            <br>
            <Warning redtext="">Loading...</Warning>
        {/if}
    </div>
</main> 

<style lang="scss">
    @import "/static/styles/style.scss";
</style>