export interface Block {
    readonly name: string;
    readonly start: Date;
    readonly end: Date;
}

export function generate(code: string): Block[] {
    const blocks: Block[] = [];

    for (const line of code.split('\n')) {
        const match = line.match(/(.*): *(\d{1,2}\.\d{1,2}\.\d{4}) *- *(\d{1,2}\.\d{1,2}\.\d{4})/);
        if (match) {
            blocks.push({
                name: match[1],
                start: new Date(match[2]),
                end: new Date(match[3]),
            });
        }
    }

    return blocks;
}