// read comment at bottom! :-)

export interface SearchResult {
    title: string;
    price: string;
    bidprice: string;
    bidcount: number;
    shipping: string;
    type: string;
    timeRemaining?: string;
    link: string;
    itemnumber: string;
    thumbnail: string;
    sellerName: string;
    feedbackScore: number;
    feedbackPercentage: string;
    condition: string;
}

export interface ApiResponse {
    results: SearchResult[];
}

// export type PageData = {
//     results: Array<{
//         title: string;
//         price: string;
//         shipping: string;
//         type: string;
//         timeRemaining?: string;
//         link: string;
//         thumbnail: string;
//     }>;
// };

export type PageData = {
    results: SearchResult[];
};

export interface EbayItem {
    title: string;
    price: { value: string };
    currentBidPrice?: {
        value: string;
    };
    bidCount: number;
    shippingOptions: Array<{ shippingCost: { value: string } }>;
    buyingOptions: string[];
    itemEndDate: string;
    itemWebUrl: string;
    itemnumber: string;
    image: { imageUrl: string };
    seller?: {
        username: string;
        feedbackScore: number;
        feedbackPercentage: string;
    };
    conditionId: string;
}

export interface TokenInfo {
    token: string;
    expiresAt: number;
}

// I don't know what this is all for, but the AI generated part of +page.server.ts and the /results svelte page doesn't seem to work without this