import { Page, Locator } from '@playwright/test';

export class ListingsPage {
    readonly page: Page;
    readonly listingsCountText: Locator;

    constructor(page: Page) {
        this.page = page;

        this.listingsCountText = page.getByText(/You have \d+ Listings?/i);
    }

    async goto(): Promise<void> {
        await this.page.goto('/listings', { waitUntil: 'domcontentloaded' });
    }

    async getListingsCount(): Promise<number> {
        const text = await this.listingsCountText.textContent();
        const match = text?.match(/(\d+)/);

        if (!match) {
            throw new Error(`Could not find a listings count in: ${text}`);
        }

        return Number(match[1]);
    }

    row(address: string): Locator {
        return this.page.getByRole('row', { name: address });
    }

}
