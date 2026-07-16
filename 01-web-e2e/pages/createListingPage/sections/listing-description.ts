import { Page, Locator } from '@playwright/test';


export class ListingDescriptionSection {
    readonly page: Page;

    readonly titleTextField: Locator;
    readonly instructionsTextField: Locator;
    readonly descriptionTextField: Locator;

    readonly nextListingAvailabilityButton: Locator;




    constructor(page: Page) {
        this.page = page;

        this.titleTextField = page.locator('#listing_title');
        this.instructionsTextField = page.locator('#listing_instructions');
        this.descriptionTextField = page.locator('#listing_description');

        this.nextListingAvailabilityButton = page.getByRole('button', { name: 'Next: Listing Availability' });

    }

    async enterTitle(title: string): Promise<void> {
        await this.titleTextField.fill(title);
    }

    async enterInstructions(instructions: string): Promise<void> {
        await this.instructionsTextField.fill(instructions);
    }

    async enterDescription(description: string): Promise<void> {
        await this.descriptionTextField.clear();
        await this.descriptionTextField.fill(description);
    }

    async clickNextListingAvailability(): Promise<void> {
        await this.nextListingAvailabilityButton.scrollIntoViewIfNeeded();
        await this.nextListingAvailabilityButton.click();
    }

}
