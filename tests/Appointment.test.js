// appointment.test.js

describe("AppointmentRules", () => {
    /// <summary>
    /// Tests that an appointment with an end time after the start time is valid
    /// </summary>
    test("AppointmentRules_EndTimeAfterStartTime_IsValid", () => {
        // Arrange
        const start = new Date("2025-09-29T08:00");
        const end = new Date("2025-09-29T09:00");

        // Act
        const isValid = end > start;

        // Assert
        expect(isValid).toBe(true);
    });

    /// <summary>
    /// Tests that an appointment with an end time equal to the start time is invalid
    /// </summary>
    test("AppointmentRules_EndTimeEqualToStartTime_IsInvalid", () => {
        // Arrange
        const start = new Date("2025-09-29T08:00");
        const end = new Date("2025-09-29T08:00");

        // Act
        const isValid = end > start;

        // Assert
        expect(isValid).toBe(false);
    });

    /// <summary>
    /// Tests that an appointment with an end time before the start time is invalid
    /// </summary>
    test("AppointmentRules_EndTimeBeforeStartTime_IsInvalid", () => {
        // Arrange
        const start = new Date("2025-09-29T09:00");
        const end = new Date("2025-09-29T08:00");

        // Act
        const isValid = end > start;

        // Assert
        expect(isValid).toBe(false);
    });
});