const testAddresses = [
    '10153 King George Boulevard, Surrey',
    '30th Street Station, Philadelphia',
    '1015 Folsom, Folsom Street, San Francisco'
];

const bookingTime = [
    '2 days',
    '4 days',
    '8 days'
];

const bookingLength= [
    '5 months',
    '10 months',
    '12 months'
];

export function getRandomTestAddress(): string {
    return testAddresses[
        Math.floor(Math.random() * testAddresses.length)
    ];
}

export function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomBookingTime(): string {
    return bookingTime[
        Math.floor(Math.random() * bookingTime.length)
    ];
}

export function getRandomBookingLength(): string {
    return bookingLength[
        Math.floor(Math.random() * bookingLength.length)
    ];
}
