import { Page, Locator } from '@playwright/test';


export class ListingPhotosSection {
    readonly page: Page;

    readonly skipThisStepAndCompleteLaterButton: Locator;

    readonly nextReviewListingButton: Locator;


    constructor(page: Page) {
        this.page = page;

        this.skipThisStepAndCompleteLaterButton = page.getByRole('button', { name: 'Skip this step & complete later' });

        this.nextReviewListingButton = page.getByRole('button', { name: 'Next: Review Listing' });
    }

    async clickSkipThisStepAndCompleteLater(): Promise<void> {
        await this.skipThisStepAndCompleteLaterButton.scrollIntoViewIfNeeded();
        await this.skipThisStepAndCompleteLaterButton.click();
        await this.page.waitForURL(/listing_review/, { waitUntil: 'domcontentloaded' });
    }

    async clickNextReviewListing(): Promise<void> {
        await this.nextReviewListingButton.click();
    }

}
