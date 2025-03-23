declare global {
    interface Window {
        StringeeClient: any;
        StringeeCall: any;
    }
}

export function loadStringeeClient(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || window.StringeeClient) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.stringee.com/sdk/web/latest/stringee-web-sdk.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Stringee SDK'));
        document.body.appendChild(script);
    });
}

export function getStringeeClient(servers: string[]): any {
    return new window.StringeeClient(servers);
}

export function getStringeeCall(client: any, from: string, to: string, isVideo: boolean): any {
    return new window.StringeeCall(client, from, to, isVideo);
}