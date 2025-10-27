describe("Appointment rules", () => {
    test("end time after start time is valid", () => {
        //Arange
        const start = new Date("2025-09-29T08:00");
        const end = new Date("2025-09-29T09:00");
        //Act
        const isValid = end > start;
        //Assert
        expect(isValid).toBe(true);
    });

    test("end time equal to start time is invalid", () => {
        //Arange
        const start = new Date("2025-09-29T08:00");
        const end = new Date("2025-09-29T08:00");
        //Act
        const isValid = end > start;
        //Assert
        expect(isValid).toBe(false);
    });

    test("end time before start time is invalid", () => {
        //Arange
        const start = new Date("2025-09-29T09:00");
        const end = new Date("2025-09-29T08:00");
        //Act
        const isValid = end > start;
        //Assert
        expect(isValid).toBe(false);
    });
});
