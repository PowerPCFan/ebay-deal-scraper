import { error } from '@sveltejs/kit';
import { getValidToken, invalidateToken } from '$lib/server/ebayAuth';
import { logDebug } from '$lib/server/debug';
import type { PageServerLoad } from './$types';
import type { EbayItem } from '$lib/types';

// Function to format time difference
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

// Mapping of condition IDs to descriptions
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

// Function to get item condition description
function getItemCondition(cid: string): string {
    return conditionMap[cid] || 'Undefined';
} 

export const load: PageServerLoad = async ({ url, params }) => {
    // Prioritize the ID from the route parameter over the query parameter
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

        // Process the item data
        const shippingCost = item.shippingOptions?.[0]?.shippingCost?.value;
        const shippingText = shippingCost === '0.00' || shippingCost === undefined ? 'Free Shipping' : `+$${shippingCost} Shipping`;

        const now = Math.trunc(Date.now() / 1000);
        const future = Math.trunc(Number(new Date(item.itemEndDate).getTime() / 1000));
        const unformattedTimeRemaining = Math.trunc(future - now);
        const timeRemaining: string = formatTimeDifference(unformattedTimeRemaining);

        const processed = {
            title: item.title,
            price: item.price?.value || 'N/A',
            bidprice: item.currentBidPrice?.value || 'N/A',
            bidcount: item.bidCount || 0,
            shipping: shippingText,
            type: item.buyingOptions?.[0] || 'Unknown',
            timeRemaining: timeRemaining,
            link: item.itemWebUrl,
            itemnumber: legacyItemId,
            thumbnail: 'https://wsrv.nl/?url=' + encodeURIComponent(item.image?.imageUrl || ''),
            sellerName: item.seller?.username || 'N/A',
            feedbackScore: item.seller?.feedbackScore || 0,
            feedbackPercentage: item.seller?.feedbackPercentage || '0',
            condition: getItemCondition(item.conditionId)
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