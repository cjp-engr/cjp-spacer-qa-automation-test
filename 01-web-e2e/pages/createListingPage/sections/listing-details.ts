import { Page, Locator } from '@playwright/test';


export class ListingDetailsSection {
    readonly page: Page;

    // parking type
    readonly indoorLotButton: Locator;

    // parking specifications
    readonly fullSizedSedanButton: Locator;

    readonly nextListingDescriptionButton: Locator;



    constructor(page: Page) {
        this.page = page;

        this.indoorLotButton = page.getByText('Indoor Lot', { exact: true });

        this.fullSizedSedanButton = page.getByText('Full sized sedan', { exact: true });
        this.nextListingDescriptionButton = page.getByRole('button', { name: 'Next: Listing Description' });
    }

    async selectParkingType(): Promise<void> {
        await this.indoorLotButton.click();
    }

    async selectParkingSpecification(): Promise<void> {
        await this.fullSizedSedanButton.click();
    }

    async selectDimensionsWidth(): Promise<void> {
    }

    async selectDimensionsLength(): Promise<void> {
    }

    async selectDimensionsHeight(): Promise<void> {
    }

    async clickNextListingDescription(): Promise<void> {
        await this.nextListingDescriptionButton.scrollIntoViewIfNeeded();
        await this.nextListingDescriptionButton.click();
    }

}
