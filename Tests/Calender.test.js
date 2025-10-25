// Unit test calender functions
// Camiel Schnackers
// 25/10/2025

describe("Calender functions", () => {
    test("should generate 7 consecutive days starting from Monday", () => {

        // Arrange
        const startDate = new Date("2025-09-29"); // This is a Monday

        // Act
        const days = generateWeekDays(startDate);

        // Assert
        expect(days.length).toBe(7);   // Check if 7 days are generated
        expect(result[0].getDay()).toBe(1);  // Check if the first day is Monday

        for (let i = 1; i < result.length; i++) { //Check if each day increases by 1
            const difference = result[i].getDate() - result[i - 1].getDate();
            expect(difference).toBe(1);
        }

        expect(result[6].getDay()).toBe(0);  // Check if the last day is Sunday
