import { test, expect } from '../../test-fixtures/base-fixture';
import { getRandomBookingLength, getRandomBookingTime, getRandomNumber, getRandomTestAddress } from '../../utils/test-data';

test.describe('Listing creation', () => {
  test('User can create a listing and see it on the dashboard',
    {
      tag: '@smoke',
    },
    async ({
      page,
      loginPage,
      createListingPage,
      homePage,
      listingsPage,
    }, testInfo) => {

      testInfo.setTimeout(120_000);

      // Generated per test execution (not at module scope) so retries
      // (playwright.config.ts sets retries in CI) get fresh values instead
      // of re-attempting with the exact same title/description/address as
      // a failed prior attempt, which would risk a duplicate-listing
      // collision — the same class of problem this suite fought earlier.
      const uniqueListingName = `Automation Test Listing ${Date.now()}`;
      const uniqueDescription = `This is a description for the automated test listing ${Date.now()}`;
      const uniqueInstructions = `This is a unique set of instructions for the automated test listing ${Date.now()}`;
      const address = getRandomTestAddress();
      // Arbitrary but deliberately modest bounds — enough range to vary
      // coverage across runs without listings that look implausible.
      const numberOfSpots = getRandomNumber(1, 10);
      const bookingNoticeTime = getRandomBookingTime();
      const bookingLength = getRandomBookingLength();
      const monthlyBooking = getRandomNumber(100, 1000);

      let listingsCountBeforeCreation = 0;

      await test.step('Verify if the user signed in', async () => {
        await page.goto('/');
        await expect(homePage.myAccountButton).toBeVisible();
      });

      await test.step('Record the current listings count', async () => {
        await listingsPage.goto();
        listingsCountBeforeCreation = await listingsPage.getListingsCount();
      });

      await test.step('Click List Your Space button', async () => {
        await createListingPage.pictureAndLocationSection.openCreateListing();
      });

      await test.step('Create a unique new listing', async () => {

        await test.step('Picture and Location section', async () => {
          await createListingPage.pictureAndLocationSection.fillLocationAddress(address);
          await createListingPage.pictureAndLocationSection.clickNextListingDetails();
        });

        await test.step('Listing Details section', async () => {
          await createListingPage.listingDetailsSection.selectParkingType();
          await createListingPage.listingDetailsSection.selectParkingSpecification();
          await createListingPage.listingDetailsSection.clickNextListingDescription();
        });

        await test.step('Listing Description section', async () => {
          await createListingPage.listingDescriptionSection.enterTitle(uniqueListingName);
          await createListingPage.listingDescriptionSection.enterDescription(uniqueDescription);
          await createListingPage.listingDescriptionSection.enterInstructions(uniqueInstructions);
          await createListingPage.listingDescriptionSection.clickNextListingAvailability();
        });

        await test.step('Listing Availability section', async () => {
          await createListingPage.listingAvailabilitySection.enterNumberOfSpots(numberOfSpots.toString());
          await createListingPage.listingAvailabilitySection.selectBookingNoticeTime(bookingNoticeTime);
          await createListingPage.listingAvailabilitySection.selectMinimumBookingLength(bookingLength);
          await createListingPage.listingAvailabilitySection.clickNextListingPrice();
        });

        await test.step('Listing Price section', async () => {
          await createListingPage.listingPriceSection.enterMonthlyBooking(monthlyBooking.toString());
          await createListingPage.listingPriceSection.clickNextListingPhotos();
        });

        await test.step('Photos of Listing section', async () => {
          await createListingPage.listingPhotosSection.clickSkipThisStepAndCompleteLater();
        });

        await test.step('Review Listing section', async () => {
          await createListingPage.reviewListingSection.clickNextSubmitListing();
        });

      });

      await test.step('Completed section', async () => {

        await expect(page).toHaveURL(/listing_submitted/);

        await createListingPage.completedSection.verifyNewlyAddedItem(uniqueDescription);
        await createListingPage.completedSection.clickGoToYourDashboard();

      });

      await test.step('Verify the listing in the dashboard', async () => {
        await expect(page).toHaveURL(/listing/);

        // The dashboard count updates asynchronously after redirect, so toPass()
        // retries the assertion until it passes or the timeout is reached rather
        // than checking once and failing on a stale render.
        // Count is relative (+1) so the assertion holds regardless of how many
        // pre-existing listings are in the staging account.
        await expect(async () => {
          const currentCount = await listingsPage.getListingsCount();
          expect(currentCount).toBe(listingsCountBeforeCreation + 1);
        }).toPass({ timeout: 10_000 });
      });
    });
});
