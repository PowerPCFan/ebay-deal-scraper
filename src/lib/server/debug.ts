function getTimestamp(): string {
    const date = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return `[${date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: timezone
    })} (${timezone})]`;
}

export function logDebug(message: string, data?: any) {
    let timestamp = getTimestamp();
    console.log(`${timestamp} [Server] Debug: ${message}`, data || '');
}