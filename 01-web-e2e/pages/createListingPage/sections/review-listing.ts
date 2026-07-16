import { Page, Locator } from '@playwright/test';


export class ReviewListingSection {
    readonly page: Page;

    readonly nextSubmitListingButton: Locator;


    constructor(page: Page) {
        this.page = page;

        this.nextSubmitListingButton = page.getByRole('link', { name: 'Next: Submit Listing' });
    }

    async clickNextSubmitListing(): Promise<void> {
        await this.nextSubmitListingButton.click();
        await this.page.waitForURL(/listing_submitted/, { waitUntil: 'domcontentloaded' });
    }

}
