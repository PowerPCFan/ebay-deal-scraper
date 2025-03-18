import { error } from '@sveltejs/kit';
import { getValidToken, invalidateToken } from '$lib/server/ebayAuth';
import { logDebug } from '$lib/server/debug';
import type { PageServerLoad } from './$types';
import type { EbayItem } from '$lib/types';

// initialize variables
let authRetries = 0;
const MAX_AUTH_RETRIES = 3; // if OAuth key fails to authenticate, it will generate a new key 3 times before aborting

function formatTimeDifference(difference: number): string {
    const days = Math.floor(difference / 86400);
    const hours = Math.floor((difference % 86400) / 3600);
    const minutes = Math.floor((difference % 3600) / 60);
    const seconds = difference % 60;

    // Create a list of nonzero time units
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    // Determine which two to display
    if (parts.length > 2) {
        return parts.slice(0, 2).join(" ");
    }

    return parts.join(" ") || "0s"; // Default to "0s" if all values are 0
}

const conditionMap: Record<string, string> = {
    "1000": "New",
    "1500": "Open Box",
    "1750": "New (with defects)",
    "2000": "Certified Refurbished",
    "2010": "Excellent - Refurbished",
    "2020": "Very Good - Refurbished",
    "2030": "Good - Refurbished",
    "2500": "Seller Refurbished",
    "2750": "Used - Like New",
    "2990": "Used - Excellent",
    "3000": "Used - Excellent",
    "3010": "Used - Very Good",
    "4000": "Used - Very Good",
    "5000": "Used - Good",
    "6000": "Used - Fair",
    "7000": "For parts or not working"
};

function getItemCondition(cid: string): string {
    const itemCondition = conditionMap[cid] || "Undefined";
    if (itemCondition === "Undefined") logDebug(`Unexpected condition ID: ${cid} - defaulting to "Undefined"`)
    return itemCondition;
}




export const load: PageServerLoad = async ({ url }) => {
    // set variables for the API call
    // example url http://localhost:5173/results?search=QUERY&filter=buy-it-now&sort=-price&page=1&minPrice={price}&maxPrice={price}
    const searchQuery = url.searchParams.get('search'); // example value: "QUERY" without quotes
    const exclusions = decodeURIComponent(url.searchParams.get('exclude'));
    const filter = url.searchParams.get('filter');
    const sort = url.searchParams.get('sort');
    const page = url.searchParams.get('page');
    const pageNumber = page ? parseInt(page, 10) : 1; // convert string to number
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const condition = url.searchParams.get('condition')

    const limit = 20;
    const offset = (pageNumber - 1) * limit;


    logDebug('🔍 Search initiated with URL params:', url.searchParams.toString());

    const endpoint = 'https://api.ebay.com/buy/browse/v1/item_summary/search?';

    // modified variables
    // const apiSearchQuery = `q=${searchQuery ? searchQuery.replace(/ /g, '%20') : ''}`
    const apiSearchQuery = `q=${encodeURIComponent(searchQuery)}`;
    const apiExclusions = exclusions ? exclusions.split(",+").map(word => `-"${word}"`).join("+") : '';
    const apiFinalSearch = `${apiSearchQuery}+${apiExclusions}`;

    let apiFilter = ''; // empty string initializes
    switch (filter) {
        case "auction":
            apiFilter = "{AUCTION}";
            break;
        case "buy-it-now":
            apiFilter = "{FIXED_PRICE}";
            break;
        case "all":
            apiFilter = "{FIXED_PRICE|AUCTION}";
            break;
        default:
            // Fallback
            console.warn(`Unexpected filter value: ${filter}`);
            apiFilter = "{FIXED_PRICE|AUCTION}"; // Default to all
    }

    let apiSort = ''; // empty string initializes
    switch (sort) {
        case "price":
            apiSort = "&sort=price";
            break;
        case "-price":
            apiSort = "&sort=-price";
            break;
        case "best-match":
            apiSort = ""; // default is best match
            break;
        case "end-time":
            apiSort = "&sort=endingSoonest";
            break;
        case "newly-listed":
            apiSort = "&sort=newlyListed"
            break;
        default:
            // Fallback
            console.warn(`Unexpected sort value: ${sort}`);
            apiSort = ""; // Default to best match
    }

    const apiLimitOffset = `&limit=${limit}&offset=${offset}` // page

    let apiMinMaxPrice = ''
    if (minPrice && !maxPrice) { // only MIN PRICE is specified
        apiMinMaxPrice = `,price:[${minPrice}],priceCurrency:USD`
    } else if (!minPrice && maxPrice) { // only MAX PRICE is specified
        apiMinMaxPrice = `,price:[..${maxPrice}],priceCurrency:USD`
    } else if (minPrice && maxPrice) { // BOTH are specified
        apiMinMaxPrice = `,price:[${minPrice}..${maxPrice}],priceCurrency:USD`
    } else { // NEITHER is specified
        apiMinMaxPrice = ''
    }

    const apiCondition = `,conditionIds:{${condition}}`

    const apiFilters = `&filter=buyingOptions:${apiFilter}${apiMinMaxPrice}${apiCondition}`

    const finalURL = `${endpoint}${apiFinalSearch}${apiFilters}${apiSort}${apiLimitOffset}`
    logDebug(`Final URL for API call: ${finalURL}`)

    // starting here, the backend code is AI generated with some modifications made by me
    // I will refactor once I know TypeScript better
    // the whole thing used to be AI but I rewrote part of it
    
    try {
        while (authRetries < MAX_AUTH_RETRIES) {
            const token = await getValidToken();

            if (!token) {
                authRetries++;
                let retriesLeft = MAX_AUTH_RETRIES - authRetries;
                if (retriesLeft === 1) {
                    logDebug(`🔄 OAuth authentication fail. Retrying... (1 try left)`);
                } else {
                    logDebug(`🔄 OAuth authentication fail. Retrying... (${retriesLeft} tries left)`);
                }
                if (authRetries === MAX_AUTH_RETRIES) {
                    throw error(401, 'Failed to authenticate with eBay after maximum retries');
                }
                continue;
            }

            const response = await fetch(finalURL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US',
                    'Accept-Charset': 'utf-8',
                }
            });

            if (response.status === 401 || response.status === 403) {
                invalidateToken();
                authRetries++;
                continue;
            }

            if (!response.ok) {
                const errorText = await response.text();
                logDebug('❌ API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw error(response.status, `Failed to fetch from eBay API: ${response.statusText}`);
            }

            const data = await response.json();
            authRetries = 0; // Reset counter on success

            if (!data.itemSummaries) {
                logDebug('No items found in response data structure');
                return { results: [] };
            }

            const results = data.itemSummaries.map((item: EbayItem) => {
                const shippingCost = item.shippingOptions?.[0]?.shippingCost?.value;
                const shippingText = shippingCost === '0.00' || shippingCost === undefined ? 'Free Shipping' : `+$${shippingCost} Shipping`;

                // Extract seller information
                const sellerName = item.seller?.username || 'N/A';
                const feedbackScore = item.seller?.feedbackScore || 0;
                const feedbackPercentage = item.seller?.feedbackPercentage || '0'; // feedbackPercentage is a string
                const sellerInfo = `${sellerName} (${feedbackScore}) (${feedbackPercentage}%)`;

                // calculate time until listing end
                // item.itemEndDate - ISO 8601 Date from eBay API, for example '2025-02-23T17:23:29.000Z'
                const now = Math.trunc(Date.now() / 1000)
                const future = Math.trunc(Number(new Date(item.itemEndDate).getTime() / 1000))
                const unformattedTimeRemaining = Math.trunc(future - now)
                const timeRemaining: string = formatTimeDifference(unformattedTimeRemaining);
                
                // get item number from url
                let itemnumber = ''
                const match = item.itemWebUrl.match(/\/itm\/(\d+)\?/);
                if (match) {
                    itemnumber = match[1];
                } else {
                    logDebug("Item number not found in URL.");
                }

                const processed = {
                    title: item.title,
                    price: item.price?.value || 'N/A',
                    bidprice: item.currentBidPrice?.value || 'N/A',
                    bidcount: item.bidCount || 0, 
                    shipping: shippingText,
                    type: item.buyingOptions?.[0] || 'Unknown',
                    timeRemaining: timeRemaining,
                    link: item.itemWebUrl,
                    itemnumber: itemnumber,
                    thumbnail: 'https://wsrv.nl/?url=' + encodeURIComponent(item.image?.imageUrl) || '',
                    sellerName: item.seller?.username || 'N/A',
                    feedbackScore: item.seller?.feedbackScore || 0,
                    feedbackPercentage: item.seller?.feedbackPercentage || '0',
                    condition: getItemCondition(item.conditionId),
                };
                return processed;
            });

            logDebug('✅ Final results:', {
                count: results.length,
                sample: results[0],
                searchParams: url.searchParams.toString()
            });

            return { results };
        }

        throw error(500, 'Maximum authentication retries reached');
    } catch (err) {
        logDebug('💥 Error details:', {
            error: err,
            message: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : 'No stack trace',
            params: url.searchParams.toString()
        });
        throw error(500, 'Failed to fetch results from eBay');
    }
}