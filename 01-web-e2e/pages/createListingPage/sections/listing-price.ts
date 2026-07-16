import { Page, Locator } from '@playwright/test';


export class ListingPriceSection {
    readonly page: Page;

    readonly monthlyBookingTextField: Locator;

    readonly nextListingPhotosButton: Locator;


    constructor(page: Page) {
        this.page = page;

        this.monthlyBookingTextField = page.getByRole('textbox');

        this.nextListingPhotosButton = page.getByRole('button', { name: 'Next: Listing Photos' });
    }

    async enterMonthlyBooking(monthlyBooking: string): Promise<void> {
        await this.monthlyBookingTextField.fill(monthlyBooking);
    }

    async clickNextListingPhotos(): Promise<void> {
        await this.nextListingPhotosButton.scrollIntoViewIfNeeded();
        await this.nextListingPhotosButton.click();
    }

}
