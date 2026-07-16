import { Page } from "@playwright/test";
import { PictureAndLocationSection } from "./sections/picture-and-location";
import { ListingDetailsSection } from "./sections/listing-details";
import { ListingDescriptionSection } from "./sections/listing-description";
import { ListingAvailabilitySection } from "./sections/listing-availability";
import { ListingPriceSection } from "./sections/listing-price";
import { ListingPhotosSection } from "./sections/photos-of-listing";
import { ReviewListingSection } from "./sections/review-listing";
import { CompletedSection } from "./sections/completed";

export class CreateListingPage {
    readonly page: Page;

    readonly pictureAndLocationSection: PictureAndLocationSection;
    readonly listingDetailsSection: ListingDetailsSection;
    readonly listingDescriptionSection: ListingDescriptionSection;
    readonly listingAvailabilitySection: ListingAvailabilitySection;
    readonly listingPriceSection: ListingPriceSection;
    readonly listingPhotosSection: ListingPhotosSection;
    readonly reviewListingSection: ReviewListingSection;
    readonly completedSection: CompletedSection;

    constructor(page: Page) {
        this.page = page;
        this.pictureAndLocationSection = new PictureAndLocationSection(page);
        this.listingDetailsSection = new ListingDetailsSection(page);
        this.listingDescriptionSection = new ListingDescriptionSection(page);
        this.listingAvailabilitySection = new ListingAvailabilitySection(page);
        this.listingPriceSection = new ListingPriceSection(page);
        this.listingPhotosSection = new ListingPhotosSection(page);
        this.reviewListingSection = new ReviewListingSection(page);
        this.completedSection = new CompletedSection(page);
    }
}