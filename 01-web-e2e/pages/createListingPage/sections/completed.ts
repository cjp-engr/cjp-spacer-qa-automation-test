import { Page, Locator, expect } from '@playwright/test';


export class CompletedSection {
    readonly page: Page;

    readonly goToYourDashboardButton: Locator;
    readonly descriptionValue: Locator;


    constructor(page: Page) {
        this.page = page;

        this.goToYourDashboardButton = page.getByRole('link', { name: 'Go to your dashboard' });

        this.descriptionValue = page
            .getByText('Parking Description & Instructions', { exact: true })
            .locator('xpath=following-sibling::*[1]');
    }

    async clickGoToYourDashboard(): Promise<void> {

        await this.goToYourDashboardButton.scrollIntoViewIfNeeded();
        await this.goToYourDashboardButton.click();

        await this.page.waitForURL(/listings/, { waitUntil: 'domcontentloaded' });
    }

    async verifyNewlyAddedItem(description: string): Promise<void> {
        await expect(this.descriptionValue).toContainText(description);
    }

}
