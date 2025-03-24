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
    shippingOptions: Array<{ 
        shippingServiceCode: string;
        shippingCost: { 
            value: string;
        };
    }>;
    buyingOptions: string[];
    itemEndDate: string;
    itemWebUrl: string;
    description: string;
    legacyItemId: string;
    image: {
        imageUrl: string;
        height: number;
        width: number;
    };
    additionalImages?: Array<{
        imageUrl: string;
        height: number;
        width: number;
    }>;
    seller?: {
        username: string;
        feedbackScore: number;
        feedbackPercentage: string;
    };
    conditionId: string;
    estimatedAvailabilities?: Array<{
        estimatedAvailabilityStatus: string;
        estimatedAvailableQuantity: number;
        estimatedSoldQuantity: number;
        estimatedRemainingQuantity: number;
        deliveryOptions: string[];
    }>;
    itemLocation?: {
        city: string; 
        stateOrProvince: string;
        postalCode: string;
        country: string; 
    }
}

export interface TokenInfo {
    token: string;
    expiresAt: number;
}

// I don't know why these types are in an external file
// this was AI generated at one point and I never bothered to change it
// it's still necessary for operation