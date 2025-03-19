<script lang="ts">
    import Titles from "$lib/components/titles.svelte";
    import Tooltip from "$lib/components/tooltip.svelte";
    import { onMount } from "svelte";
    // import type { PageData, SearchResult } from '$lib/types.ts';

    // let data: PageData;
    
    let { children, ...rest } = $props();
    // let allResults: SearchResult[] = data?.results || [];

    let browserIsFirefox: boolean = false; // Declare outside, initialize to a default value

    let loading: boolean = false;
    let pageNumber: number = 1;

    let width: number;

    let url: URL; // value defined in onMount
    let baseUrl: string = $state(''); // value defined in onMount
    let searchQuery: string = $state(''); // value defined in onMount
    let exclusions: string = $state(''); // real value defined in onMount
    let filterAuction: boolean = $state(false); // value defined in onMount
    let filterBuyItNow: boolean = $state(false); // value defined in onMount
    let sortBy: string = $state(''); // this sort thing is confusing the variables are messed up!!!
    let minPrice: string = $state(''); // value defined in onMount
    let maxPrice: string = $state(''); // value defined in onMount
    let condition: string = $state(''); // value defined in onMount

    $effect(() => {
        exclusions = exclusions
        .replace(/[^a-zA-Z0-9,.!@#$%^&*()_+\-=\[\]{};:\/\\|<>? ]/g, "")   // Allow most special chars except quotes
        .replace(/\s{2,}/g, " ")            // Replace consecutive spaces with a single space
        .replace(/,{2,}/g, ",")             // Prevent consecutive commas
        .replace(/,\s{2,}/g, ", ")          // Prevent ",  , " (comma + multiple spaces)
        .replace(/(,)\1+/g, ",");           // Prevent consecutive commas (like , , ,)
    })

    function runIfEnterKey(kbdevent: KeyboardEvent, callback: () => void) {
        if (kbdevent.key === "Enter") {
            callback();
        }
    }

    function buildConditionString() {
        const conditionIds = Array.from(document.querySelectorAll('.condition-box:checked') as NodeListOf<HTMLInputElement>)
            .map(box => box.getAttribute('data-id'))
            .filter(id => id !== null && id !== "")
            .join('|');    
        const condition = conditionIds.replace(/\|{2,}/g, '|');
        console.log(`[Client] Debug: Condition String: ${condition}`)
        return condition
    }

    function handleSubmit() {
        if (searchQuery === '') { 
            alert(`Error: no search query entered.`)
            console.log(`Exclusions: ${exclusions}`)
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
             
            window.location.href = `/results?${queryParams}`;
            console.log('[Client] Debug: Navigating to results page:', `/results?${queryParams}`);
        }
    }

    onMount(() => {
        // // CURRENT URL
        url = new URL(window.location.href);
        baseUrl = url.origin;
        console.log(`Current URL: ${url}\nBase URL: ${baseUrl}`)

        // Setting up ACTUAL variable values so the different filters are set to their proper values
        searchQuery = url.searchParams.get('search') || '';
        exclusions = url.searchParams.get('exclude') || '';
        
        let filter = url.searchParams.get('filter') || '';
        if (filter === 'buy-it-now') {
            (document.getElementById('buyitnow-checkbox') as HTMLInputElement).checked = true;
            (document.getElementById('auction-checkbox') as HTMLInputElement).checked = false;
            filterAuction = false;
            filterBuyItNow = true;
        } else if (filter === 'auction') {
            (document.getElementById('auction-checkbox') as HTMLInputElement).checked = true;
            (document.getElementById('buyitnow-checkbox') as HTMLInputElement).checked = false;
            filterAuction = true;
            filterBuyItNow = false;
        } else {
            (document.getElementById('buyitnow-checkbox') as HTMLInputElement).checked = true;
            (document.getElementById('auction-checkbox') as HTMLInputElement).checked = true;
            filterAuction = true;
            filterBuyItNow = true;
        }

        let sort = url.searchParams.get('sort') || 'best-match';
        if (sort === 'price') { sortBy = "price" } 
        else if (sort === '-price') { sortBy = "-price" } 
        else if (sort === 'newly-listed') { sortBy = "newly-listed" } 
        else if (sort === 'end-time') { sortBy = "end-time" }
        else { sortBy = "best-match" }

        { // Set the min/max price based on URL and ensure that minPrice is smaller than maxPrice
            let minPriceTemp = url.searchParams.get('minPrice') || '';
            let maxPriceTemp = url.searchParams.get('maxPrice') || '';
            
            let minPriceNum = minPriceTemp ? parseFloat(minPriceTemp) : 0;
            let maxPriceNum = maxPriceTemp ? parseFloat(maxPriceTemp) : 0;
            
            if (minPriceNum >= maxPriceNum && maxPriceNum !== 0) {
                minPrice = (maxPriceNum - 1).toString();
                maxPrice = maxPriceNum.toString();
            } else {
                minPrice = minPriceTemp;
                maxPrice = maxPriceTemp;
            }
        }

        // Checkboxes
        function updateMainCheckboxState(mainCheckbox: HTMLInputElement, subCheckboxes: NodeListOf<HTMLInputElement>) {
            const checkedCount = Array.from(subCheckboxes).filter(checkbox => checkbox.checked).length;
            
            // Find the caret and panel elements associated with this checkbox
            const caretElement = mainCheckbox.parentElement?.nextElementSibling as HTMLElement;
            let panelElement = caretElement?.nextElementSibling as HTMLElement;
            while (panelElement && !panelElement.classList.contains("panel")) {
                panelElement = panelElement.nextElementSibling as HTMLElement;
            }

            if (checkedCount === subCheckboxes.length) {
                mainCheckbox.checked = true;
                mainCheckbox.indeterminate = false;
            } else if (checkedCount === 0) {
                mainCheckbox.checked = false;
                mainCheckbox.indeterminate = false;
            } else {
                mainCheckbox.checked = false;
                mainCheckbox.indeterminate = true;
                
                // Automatically open the accordion when indeterminate
                if (caretElement && panelElement) {
                    panelElement.style.display = "block";
                    caretElement.style.transform = "rotate(180deg)";
                }
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
                updateCondition();
            });

            subCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    updateMainCheckboxState(mainCheckbox, subCheckboxes);
                    updateCondition();
                });
            });
        }

        setupCheckboxSync('new-condition', '.other-new-condition');
        setupCheckboxSync('refurbished-condition', '.other-refurbished-condition');
        setupCheckboxSync('used-condition', '.other-used-condition');
        const notWorkingCheckbox = document.getElementById('notworking-condition') as HTMLInputElement;
        if (notWorkingCheckbox) {
            notWorkingCheckbox.addEventListener('change', updateCondition);
        }

        condition = url.searchParams.get('condition') || '';
        console.log('Condition string:', condition);

        // Modify the checkbox checking code to log failures
        const setCheckbox = (dataId: string) => {
            const checkbox = document.querySelector(`[data-id="${dataId}"]`) as HTMLInputElement;
            if (checkbox) {
                checkbox.checked = true;
            } else {
                console.log(`Failed to find checkbox with data-id: ${dataId}`);
            }
        };

        if (condition.includes("1000")) setCheckbox("1000");
        if (condition.includes("1500")) setCheckbox("1500");
        if (condition.includes("1750")) setCheckbox("1750");
        if (condition.includes("2000")) setCheckbox("2000");
        if (condition.includes("2010")) setCheckbox("2010");
        if (condition.includes("2020")) setCheckbox("2020");
        if (condition.includes("2030")) setCheckbox("2030");
        if (condition.includes("2500")) setCheckbox("2500");
        if (condition.includes("2750")) setCheckbox("2750");
        if (condition.includes("2990") || condition.includes("3000")) setCheckbox("2990|3000");
        if (condition.includes("3010") || condition.includes("4000")) setCheckbox("3010|4000");
        if (condition.includes("5000")) setCheckbox("5000");
        if (condition.includes("6000")) setCheckbox("6000");
        if (condition.includes("7000")) setCheckbox("7000");

        // code was broken so copilot told me to add this
        const newCheckbox = document.getElementById('new-condition') as HTMLInputElement;
        const refurbishedCheckbox = document.getElementById('refurbished-condition') as HTMLInputElement;
        const usedCheckbox = document.getElementById('used-condition') as HTMLInputElement;
        updateMainCheckboxState(newCheckbox, document.querySelectorAll<HTMLInputElement>('.other-new-condition'));
        updateMainCheckboxState(refurbishedCheckbox, document.querySelectorAll<HTMLInputElement>('.other-refurbished-condition'));
        updateMainCheckboxState(usedCheckbox, document.querySelectorAll<HTMLInputElement>('.other-used-condition'));


        // allResults = data?.results || [];
        browserIsFirefox = navigator.userAgent.toLowerCase().includes("firefox");

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
    });

    // function updateMinMaxPrices() {
    //     const updatedMinMaxUrl = replaceSearchParam(((replaceSearchParam(url, 'minPrice', minPrice) as unknown) as URL), 'maxPrice', maxPrice)
    //     window.location.href = updatedMinMaxUrl;
    // };

    function updateMinMaxPrices() {
        const updatedUrl = new URL(window.location.href);
        updatedUrl.searchParams.set('minPrice', minPrice);
        updatedUrl.searchParams.set('maxPrice', maxPrice);
        window.location.href = updatedUrl.toString();
    }

    function updateExclusions() {
        const updatedUrl = new URL(window.location.href);
        updatedUrl.searchParams.set('exclude', exclusions);
        window.location.href = updatedUrl.toString();
    }
    
    function updateCondition() {
        const updatedUrl = new URL(window.location.href);
        const conditionTemp = buildConditionString();
        updatedUrl.searchParams.set('condition', conditionTemp);
        window.location.href = updatedUrl.toString();
    }

    function updateFilter() {
        const updatedUrl = new URL(window.location.href);
        if (filterAuction === filterBuyItNow) {
            updatedUrl.searchParams.set('filter', 'all');
        } else if (filterAuction) {
            updatedUrl.searchParams.set('filter', 'auction');
        } else if (filterBuyItNow) {
            updatedUrl.searchParams.set('filter', 'buy-it-now');
        }
        window.location.href = updatedUrl.toString();
    }

    function updateSort() {
        console.log('📊 [Client] Debug: Sort changed to:', sortBy)
        const updatedUrl = new URL(window.location.href);
        updatedUrl.searchParams.set('sort', sortBy);
        window.location.href = updatedUrl.toString();
    }
</script>

<div id="searchresults-title-grid">
    <a href={baseUrl} class="inline-block" aria-label="Go to home page">
        <div class="fa-solid fa-house-chimney inline-block" aria-label="Go to home page"></div>
    </a>
    {#if width >= 888}
    <Titles large style="margin-top: -15px; margin-bottom: 15px;">Search Results</Titles>
    {:else}
    <Titles custom-58px style="margin-top: -15px; margin-bottom: 15px;">Search Results</Titles>
    {/if}

    <div class="search-row">
        <input
            id="search"
            placeholder="Enter search query..."
            bind:value={searchQuery}
            onkeydown={(e) => runIfEnterKey(e, handleSubmit)}
            oninput={() => console.log('📝 [Client] Debug: Search query updated:', searchQuery)} />
            <button type="submit" class="searchbutton" onclick={handleSubmit}>Search</button>
    </div>
</div>
<div id="main-flexbox">
    <div id="sidebar">
        <h1>Filters</h1>
            <label for="exclusions-flexbox" class="block">
                <Tooltip 
                    fontsize="1rem" 
                    questionmark 
                    title="Exclude Words" 
                    text="Word exclusion lets you filter out results containing a certain word. <br><br>For instance, if you are searching for something and you don't want results that contain the word &quot;box&quot;, you can type the word &quot;box&quot; into the Exclude Words box to remove all results containing the word box. <br><br>You can enter one word or multiple words. <br><br><strong>NOTE:</strong> This feature will only work properly if you separate words using commas. For example: <code>box, backplate, not working, for parts</code>"
                    >Exclude Words
                </Tooltip>
            </label>
            <div class="field-button-container" id="exclusions-flexbox">
                <input 
                    class="block" 
                    type="text" 
                    id="exclusions" 
                    bind:value={exclusions} 
                    onblur={(e) => {
                        if ((e.target as HTMLInputElement).value !== url.searchParams.get('exclude')) {
                            updateExclusions();
                        }
                    }}
                    onkeydown={(e) => runIfEnterKey(e, updateExclusions)}
                    placeholder="Enter words to exclude..."
                >
                <button 
                    aria-label="Update Exclusions"
                    onclick={updateExclusions}
                    class="submit-button"
                >
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
            <br>
            <label for="listing-type">Listing Type:</label>
            <div id="listing-type">
                <label>
                    <input id="auction-checkbox" class="listingtypecheckboxes" type="checkbox" bind:checked={filterAuction} onchange={updateFilter}>
                    Auction
                </label>
                <br>
                <label>
                    <input id="buyitnow-checkbox" class="listingtypecheckboxes" type="checkbox" bind:checked={filterBuyItNow} onchange={updateFilter}>
                    Buy It Now
                </label>
            </div>
            
            <label class="block" for="sort" style="margin-top: 15px !important;">Sort By:</label>
            <select class="block" id="sort" bind:value={sortBy} onchange={updateSort}>
                <option value="best-match">Best Match</option>
                <option value="price">Price + Shipping (lowest to highest)</option>
                <option value="-price">Price + Shipping (highest to lowest)</option>
                <option value="newly-listed">List Time (new to old)</option>
                {#if filterAuction && !filterBuyItNow}
                    <option value="end-time">Auction End Time</option>
                {/if}
            </select>
    
            <label class="block" for="price-filter" style="margin-top: 15px !important;">Price:</label>
            <div class="field-button-container" id="price-filter">
                <span>$</span>
                <input 
                    type="text" 
                    inputmode="numeric" 
                    id="minPrice" 
                    bind:value={minPrice} 
                    onblur={(e) => {
                        if ((e.target as HTMLInputElement).value !== url.searchParams.get('minPrice')) {
                            updateMinMaxPrices();
                        }
                    }}
                    onkeydown={(e) => runIfEnterKey(e, updateMinMaxPrices)}
                    placeholder="Min"
                >
                <span>to $</span>
                <input 
                    type="text" 
                    inputmode="numeric" 
                    id="maxPrice" 
                    bind:value={maxPrice} 
                    onblur={(e) => {
                        if ((e.target as HTMLInputElement).value !== url.searchParams.get('maxPrice')) {
                            updateMinMaxPrices();
                        }
                    }}
                    onkeydown={(e) => runIfEnterKey(e, updateMinMaxPrices)}
                    placeholder="Max"
                >
                <button aria-label="Update Min/Max Prices" onclick={updateMinMaxPrices} class="submit-button"><i class="fa-solid fa-arrow-right"></i></button>
            </div>
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
                    Excellent
                </label>
                <br>                    
                <label>
                    <input type="checkbox" class="condition-box indented-condition-box other-refurbished-condition" data-id="2020">
                    Very Good
                </label>
                <br>                    
                <label>
                    <input type="checkbox" class="condition-box indented-condition-box other-refurbished-condition" data-id="2030">
                    Good
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
                    Like New
                </label>
                <br>                    
                <label>
                    <input type="checkbox" class="condition-box indented-condition-box other-used-condition" data-id="2990|3000">
                    Excellent
                </label>
                <br>                    
                <label>
                    <input type="checkbox" class="condition-box indented-condition-box other-used-condition" data-id="3010|4000">
                    Very Good
                </label>
                <br>                    
                <label>
                    <input type="checkbox" class="condition-box indented-condition-box other-used-condition" data-id="5000">
                    Good
                </label>
                <br>                    
                <label>
                    <input type="checkbox" class="condition-box indented-condition-box other-used-condition" data-id="6000">
                    Fair
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
    <div id="results-container">
        {@render children()}
    </div>
</div>

<style lang="scss">
    @import '/static/styles/style.scss';
</style>