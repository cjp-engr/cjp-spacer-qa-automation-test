import { Page, Locator } from '@playwright/test';


export class ListingAvailabilitySection {
    readonly page: Page;

    readonly numberOfSpotsTextField: Locator;
    readonly bookingNoticeTimeField: Locator;
    readonly minimumBookingLengthField: Locator;

    readonly nextListingPriceButton: Locator;


    constructor(page: Page) {
        this.page = page;

        this.numberOfSpotsTextField = page.locator('#numberOfSpaces');
        this.bookingNoticeTimeField = page.getByRole('combobox', { name: 'Booking Notice Time:' });
        this.minimumBookingLengthField = page.getByRole('combobox', { name: 'Minimum Booking Length:' });

        this.nextListingPriceButton = page.getByRole('button', { name: 'Next: Listing Price' });
    }

    async enterNumberOfSpots(numberOfSpots: string): Promise<void> {
        await this.numberOfSpotsTextField.fill(numberOfSpots);
    }

    async selectBookingNoticeTime(bookingNoticeTime: string): Promise<void> {
        await this.bookingNoticeTimeField.selectOption(bookingNoticeTime);
    }

    async selectMinimumBookingLength(minimumBookingLength: string): Promise<void> {
        await this.minimumBookingLengthField.selectOption(minimumBookingLength);
    }

    async clickNextListingPrice(): Promise<void> {
        await this.nextListingPriceButton.scrollIntoViewIfNeeded();
        await this.nextListingPriceButton.click();
    }

}
