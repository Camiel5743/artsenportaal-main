describe("Lab results sorting", () => {
    test("sorts measurements by ascending date", () => {
        const measurements = [
            { id: 1, dateTime: "2025-10-05T10:00:00Z", value: "5" },
            { id: 2, dateTime: "2025-09-29T08:00:00Z", value: "7" },
            { id: 3, dateTime: "2025-09-30T12:00:00Z", value: "9" }
        ];

        const sorted = measurements.sort((a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );

        expect(sorted.map(m => m.id)).toEqual([2, 3, 1]);
        // Id 2 (29 sept) ? Id 3 (30 sept) ? Id 1 (5 okt)
    });

    test("handles already sorted list", () => {
        const measurements = [
            { id: 10, dateTime: "2025-09-01T08:00:00Z" },
            { id: 11, dateTime: "2025-09-02T08:00:00Z" }
        ];

        const sorted = measurements.sort((a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );

        expect(sorted.map(m => m.id)).toEqual([10, 11]);
    });

    test("handles equal dates without breaking", () => {
        const measurements = [
            { id: 21, dateTime: "2025-09-10T08:00:00Z" },
            { id: 22, dateTime: "2025-09-10T08:00:00Z" }
        ];

        const sorted = measurements.sort((a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );

        expect(sorted.length).toBe(2);
        expect(sorted.map(m => m.id)).toEqual([21, 22]);
    });
});