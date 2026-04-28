export const prettifyServiceName = (raw?: string) => {
    if (!raw) return '';

    const prefixMap: Record<string, string> = {
        iOS: '📱 iOS',
        Android: '📱 Android',
        Mac: '💻 macOS',
        PC: '🖥️ PC',
        Linux: '🖥️ Linux',
        TV: '📺 TV',
        Router: '📡 Router',
    };

    for (const [prefix, pretty] of Object.entries(prefixMap)) {
        if (raw === prefix || raw.startsWith(prefix + '_')) {
            return pretty;
        }
    }

    return raw;
};