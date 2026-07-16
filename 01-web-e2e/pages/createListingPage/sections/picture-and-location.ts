import { Page, Locator, expect } from '@playwright/test';

export class PictureAndLocationSection {
  readonly page: Page;
  readonly listYourSpaceButton: Locator;
  readonly uploadPhotoButton: Locator;
  readonly addressInput: Locator;
  readonly nextListingDetailsButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.listYourSpaceButton = page.getByRole('link', { name: 'List Your Space' });

    this.uploadPhotoButton = page.getByLabel('Upload Photo');
    this.addressInput = page.getByLabel(/address/i);

    this.nextListingDetailsButton = page.getByRole('button', { name: 'Next: Listing Details' });
  }

  async openCreateListing(): Promise<void> {
    await expect(this.listYourSpaceButton).toBeVisible();
    await this.listYourSpaceButton.click();
  }

  async fillLocationAddress(address: string): Promise<void> {
    const addressInput = this.page.getByLabel(/location address/i);
    await addressInput.click();
    await addressInput.pressSequentially(address, { delay: 100 });

    const firstSuggestion = this.page.locator('.pac-item').first();
    await firstSuggestion.waitFor({ state: 'visible' });
    await firstSuggestion.click();

  }

  async clickNextListingDetails(): Promise<void> {
    await this.nextListingDetailsButton.scrollIntoViewIfNeeded();
    await this.nextListingDetailsButton.click();
  }
}
