import { error } from '@sveltejs/kit';
import { getValidToken, invalidateToken } from '$lib/server/ebayAuth';
import { logDebug } from '$lib/server/debug';
import sanitizeHtml from 'sanitize-html';
import type { PageServerLoad } from './$types';
import type { EbayItem } from '$lib/types';

function formatTimeDifference(difference: number): string {
    const days = Math.floor(difference / 86400);
    const hours = Math.floor((difference % 86400) / 3600);
    const minutes = Math.floor((difference % 3600) / 60);
    const seconds = difference % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.slice(0, 2).join(' ') || '0s';
}

const conditionMap: Record<string, string> = {
    '1000': 'New',
    '1500': 'Open Box',
    '1750': 'New (with defects)',
    '2000': 'Certified Refurbished',
    '2010': 'Excellent - Refurbished',
    '2020': 'Very Good - Refurbished',
    '2030': 'Good - Refurbished',
    '2500': 'Seller Refurbished',
    '2750': 'Used - Like New',
    '2990': 'Used - Excellent',
    '3000': 'Used - Excellent',
    '3010': 'Used - Very Good',
    '4000': 'Used - Very Good',
    '5000': 'Used - Good',
    '6000': 'Used - Fair',
    '7000': 'For parts or not working'
};

function getItemCondition(cid: string): string {
    return conditionMap[cid] || 'Undefined';
}

export const load: PageServerLoad = async ({ url, params }) => {
    const legacyItemId = params.id || url.searchParams.get('id');

    if (!legacyItemId) {
        throw error(400, 'Missing legacy_item_id parameter');
    }

    const endpoint = `https://api.ebay.com/buy/browse/v1/item/get_item_by_legacy_id?legacy_item_id=${legacyItemId}`;
    logDebug(`Final URL for API call: ${endpoint}`);

    try {
        const token = await getValidToken();

        if (!token) {
            throw error(401, 'Failed to authenticate with eBay');
        }

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Language': 'en-US',
                'Accept-Charset': 'utf-8'
            }
        });

        // Check for variations (status 400 with error code 11006)
        if (response.status === 400) {
            const errorData = await response.json();
            if (errorData?.errors?.[0]?.errorId === 11006) {
                logDebug('📦 Variation item detected');
                const processed = {
                    hasVariations: true,
                    title: 'Item with variations',
                    price: 'See variations',
                    shipping: 'See variations',
                    link: `https://www.ebay.com/itm/${legacyItemId}`,
                    itemnumber: legacyItemId
                };
                return { item: processed };
            }
        }

        if (response.status === 401 || response.status === 403) {
            invalidateToken();
            throw error(response.status, 'Unauthorized or Forbidden');
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

        const item: EbayItem = await response.json();

        const shippingCost = item.shippingOptions?.[0]?.shippingCost?.value;
        const shippingText = shippingCost === '0.00' || shippingCost === undefined ? 'Free' : shippingCost;

        // Wasn't working right so I commented out

        // const sanitized_description = sanitizeHtml(item.description, {
        //     allowedTags: [
        //         "address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
        //         "h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
        //         "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
        //         "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
        //         "em", "i", "img", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", 
        //         "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", 
        //         "caption", "col", "colgroup", "table", "tbody", "td", "tfoot", "th", 
        //         "thead", "tr"
        //     ],
        //     allowedSchemes: [ 'http', 'https', 'mailto', 'tel' ],
        //     allowedAttributes: {
        //         a: ['href', 'target'],
        //         img: [ 'src', 'alt', 'title', 'width', 'height', 'loading' ]
        //     },
        //     allowedStyles: {
        //         '*': {
        //             // Box model
        //             'margin*': [/^[0-9]+(px|em|rem|%)$/],
        //             'padding*': [/^[0-9]+(px|em|rem|%)$/],
        //             'border*': [/.*/],
                    
        //             // Layout
        //             'display': [/^(block|inline|inline-block|flex|grid|none)$/],
        //             'width': [/^[0-9]+(px|em|rem|%|vw)$/],
        //             'height': [/^[0-9]+(px|em|rem|%|vh)$/],
        //             'vertical-align': [/^(top|middle|bottom|baseline)$/],
                    
        //             // Typography
        //             'color': [/^#[0-9a-f]{3,6}$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
        //             'background-color': [/^#[0-9a-f]{3,6}$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
        //             'font-family': [/.*/],
        //             'font-size': [/^[0-9]+(px|em|rem|%)$/],
        //             'font-weight': [/^(normal|bold|[1-9]00)$/],
        //             'text-align': [/^(left|center|right|justify)$/],
        //             'line-height': [/^[0-9]+(px|em|rem|%)?$/],
                    
        //             // Box sizing
        //             'box-sizing': [/^(border-box|content-box)$/]
        //         },
        //     },
        // });



        // DEBUG ONLY! DO NOT UNCOMMENT
        // oops i broke the rule
        const sanitized_description = item.description;

        const now = Math.trunc(Date.now() / 1000);
        const future = Math.trunc(Number(new Date(item.itemEndDate).getTime() / 1000));
        const unformattedTimeRemaining = Math.trunc(future - now);
        const timeRemaining: string = formatTimeDifference(unformattedTimeRemaining);

        const processed = {
            hasVariations: false,
            title: item.title,
            price: item.price?.value || 'N/A',
            bidprice: item.currentBidPrice?.value || 'N/A',
            bidcount: item.bidCount || 0,
            shipping: shippingText,
            shippingService: item.shippingOptions?.[0]?.shippingServiceCode,
            auction: item.buyingOptions?.includes('AUCTION') || false,
            buyitnow: item.buyingOptions?.includes('FIXED_PRICE') || false,
            bestoffer: item.buyingOptions?.includes('BEST_OFFER') || false,
            timeRemaining: timeRemaining,
            link: item.itemWebUrl,
            description: sanitized_description,
            itemnumber: item.legacyItemId || legacyItemId, // get the item number that is returned to the svelte page via the API response, otherwise just use the ID that was given via /itm/[id] url
            thumbnail: 'https://wsrv.nl/?url=' + encodeURIComponent(item.image?.imageUrl || ''),
            additionalImages: item.additionalImages?.map(img => ({
                imageUrl: 'https://wsrv.nl/?url=' + encodeURIComponent(img.imageUrl),
                height: img.height,
                width: img.width
            })),
            image: {
                imageUrl: 'https://wsrv.nl/?url=' + encodeURIComponent(item.image?.imageUrl || ''),
                height: item.image?.height || 0,
                width: item.image?.width || 0
            },
            sellerName: item.seller?.username || 'N/A',
            feedbackScore: item.seller?.feedbackScore || 0,
            feedbackPercentage: item.seller?.feedbackPercentage || '0',
            condition: getItemCondition(item.conditionId),

            availability: item.estimatedAvailabilities?.[0]?.estimatedAvailabilityStatus,
            availablequantity: item.estimatedAvailabilities?.[0]?.estimatedAvailableQuantity,
            soldquantity: item.estimatedAvailabilities?.[0]?.estimatedSoldQuantity,
            remainingquantity: item.estimatedAvailabilities?.[0]?.estimatedRemainingQuantity,

            city: item.itemLocation?.city,
            state: item.itemLocation?.stateOrProvince,
            country: item.itemLocation?.country === "US" ? "United States" : (item.itemLocation?.country || 'Unknown')
        };

        logDebug('✅ Item details retrieved:', processed);
        return { item: processed };

    } catch (err) {
        logDebug('💥 Error details:', {
            error: err,
            message: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : 'No stack trace',
            params: url.searchParams.toString()
        });
        throw error(500, 'Failed to fetch item details from eBay');
    }
};
