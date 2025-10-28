describe("NotesService", () => {
    // Mock localStorage zodat we lokaal kunnen testen
    beforeEach(() => {
        let store = {};
        global.localStorage = {
            getItem: (key) => store[key] || null,
            setItem: (key, value) => { store[key] = value.toString(); },
            removeItem: (key) => { delete store[key]; },
            clear: () => { store = {}; },
        };
    });

    /// <summary>
    /// Tests that a new note can be created and retrieved successfully
    /// </summary>
    test("NotesService_CreateNote_SavesAndReturnsCorrectNote", () => {
        // Arrange
        const noteData = {
            patientId: "1",
            patientName: "Patient A",
            title: "First Note",
            content: "Patient is recovering well",
            createdBy: "Dr. Test",
        };

        // Act
        const note = notesService.createNote(
            noteData.patientId,
            noteData.patientName,
            noteData.title,
            noteData.content,
            noteData.createdBy
        );

        // Assert
        expect(note.patientId).toBe("1");
        expect(note.title).toBe("First Note");

        const stored = notesService.getNotesByPatient("1");
        expect(stored.length).toBe(1);
        expect(stored[0].title).toBe("First Note");
    });

    /// <summary>
    /// Tests that notes can be fetched for a specific patient
    /// </summary>
    test("NotesService_GetNotesByPatient_ReturnsCorrectNotes", () => {
        // Arrange
        notesService.createNote("1", "Patient A", "Note 1", "Content 1");
        notesService.createNote("2", "Patient B", "Note 2", "Content 2");

        // Act
        const notesForPatient1 = notesService.getNotesByPatient("1");

        // Assert
        expect(notesForPatient1.length).toBe(1);
        expect(notesForPatient1[0].patientName).toBe("Patient A");
    });

    /// <summary>
    /// Tests that a note can be updated successfully
    /// </summary>
    test("NotesService_UpdateNote_ChangesNoteTitle", () => {
        // Arrange
        const note = notesService.createNote("1", "Patient A", "Old Title", "Old content");

        // Act
        const success = notesService.updateNote(note.id, { title: "New Title" });

        // Assert
        expect(success).toBe(true);
        const updated = notesService.getNotesByPatient("1")[0];
        expect(updated.title).toBe("New Title");
    });

    /// <summary>
    /// Tests that a note can be deleted successfully
    /// </summary>
    test("NotesService_DeleteNote_RemovesNoteFromList", () => {
        // Arrange
        const note = notesService.createNote("1", "Patient A", "To Delete", "Some content");

        // Act
        const success = notesService.deleteNote(note.id);

        // Assert
        expect(success).toBe(true);
        const notes = notesService.getNotesByPatient("1");
        expect(notes.length).toBe(0);
    });
});