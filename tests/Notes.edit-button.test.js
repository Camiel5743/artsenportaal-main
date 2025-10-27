
// Unit test for Addnote
// Camiel Schnackers
// 26/10/2025
// Deze versie zou ALLE tests moeten laten slagen
describe("Notes edit button Validation", () => {

    test("should not allow title containing only punctuation marks", () => {
        // Arrange
        const title = "!!!???...///";
        const content = "Valid content with letters.";

        // Act
        const result = validateNoteInput(title, content);

        // Assert
        expect(result.isValid).toBe(false);
    });

    test("should not allow title containing only letters", () => {
        // Arrange
        const title = "Justletters";
        const content = "Valid content with letters.";

        // Act
        const result = validateNoteInput(title, content);

        // Assert
        expect(result.isValid).toBe(false);
    });

    test("should not allow title with only whitespaces", () => {
        // Arrange
        const title = "     ";
        const content = "Some valid content.";

        // Act
        const result = validateNoteInput(title, content);

        // Assert
        expect(result.isValid).toBe(false);
    });

    test("should not allow content with only whitespaces", () => {
        // Arrange
        const title = "Valid Title 123";
        const content = "     ";

        // Act
        const result = validateNoteInput(title, content);

        // Assert
        expect(result.isValid).toBe(false);
    });

    test("should allow content containing only letters", () => {
        // Arrange
        const title = "Valid Title 123";
        const content = "Thisisvalidcontent";

        // Act
        const result = validateNoteInput(title, content);

        // Assert
        expect(result.isValid).toBe(true);
    });

    test("should not allow content with only punctuation", () => {
        // Arrange
        const title = "Valid Title";
        const content = "!!!???...,,,";

        // Act
        const result = validateNoteInput(title, content);

        // Assert
        expect(result.isValid).toBe(false);
    });

    test("should allow content containing letters", () => {
        // Arrange
        const title = "Valid Title";
        const content = "This content includes letters and spaces.";

        // Act
        const result = validateNoteInput(title, content);

        // Assert
        expect(result.isValid).toBe(true);
    });

    test("should not allow both title and content to be empty or whitespace", () => {
        // Arrange
        const title = "     ";
        const content = "     ";

        // Act
        const result = validateNoteInput(title, content);

        // Assert
        expect(result.isValid).toBe(false);
    });

});

