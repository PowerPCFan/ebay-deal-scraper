import { env } from '$env/dynamic/private';
import { logDebug } from '$lib/server/debug';
import type { TokenInfo } from '$lib/types';

let tokenCache: TokenInfo | null = null;
const TOKEN_REFRESH_INTERVAL = 6969; // seconds before a new OAuth token is generated

export async function getValidToken(): Promise<string | null> { // function to generate valid tokens. Valid token is always stored in var {data.access_token} and you use {tokenCache.token}
    const now = Math.trunc(Date.now() / 1000); // if this doesn't work for some reason try Math.floor

    if (tokenCache && now < tokenCache.expiresAt) {
        logDebug('🔑 Using cached token', { 
            expiresIn: tokenCache.expiresAt - now,
            preview: `${tokenCache.token.substring(0, 5)}...`
        });
        return tokenCache.token;
    }

    try {
        if (!env.EBAY_APP_ID || !env.EBAY_CERT_ID) {
            logDebug('❌ Missing eBay credentials! Check .env file for: EBAY_APP_ID, EBAY_CERT_ID');
            return null;
        }

        const credentials = Buffer.from(`${env.EBAY_APP_ID}:${env.EBAY_CERT_ID}`).toString('base64');
        const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            },
            body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
        });

        if (!response.ok) {
            logDebug('Token request failed', {
                status: response.status,
                statusText: response.statusText
            });
            return null;
        }

        const data = await response.json();
        tokenCache = {
            token: data.access_token,
            expiresAt: now + TOKEN_REFRESH_INTERVAL
        };

        logDebug('New token generated', {
            expiresIn: TOKEN_REFRESH_INTERVAL,
            preview: `${data.access_token.substring(0, 5)}...`
        });

        return data.access_token;
    } catch (err) {
        logDebug('Token generation error! ', err);
        return null;
    }
}

export function invalidateToken(): void {
    tokenCache = null;
    logDebug('Token cache invalidated');
}