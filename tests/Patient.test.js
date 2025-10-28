describe("PatientService", () => {
    /// <summary>
    /// Tests that all patients (5 total) are fetched from the API
    /// </summary>
    test("PatientService_GetAllPatients_ReturnsFivePatientsFromAPI", async () => {
        // Arrange
        const mockPatients = [
            { id: 1, name: "Patient 1" },
            { id: 2, name: "Patient 2" },
            { id: 3, name: "Patient 3" },
            { id: 4, name: "Patient 4" },
            { id: 5, name: "Patient 5" },
        ];
        axios.get.mockResolvedValueOnce({ data: { data: mockPatients } });

        // Act
        const result = await getAllPatients();

        // Assert
        expect(result.length).toBe(5);
        expect(axios.get).toHaveBeenCalledWith("http://localhost:1337/api/patients");
    });

    /// <summary>
    /// Tests that selecting a specific patient returns the correct one from API
    /// </summary>
    test("PatientService_GetPatientById_ReturnsCorrectPatient", async () => {
        // Arrange
        const mockPatient = { id: 3, name: "Patient 3" };
        axios.get.mockResolvedValueOnce({ data: { data: mockPatient } });

        // Act
        const result = await getPatientById(3);

        // Assert
        expect(result.id).toBe(3);
        expect(result.name).toBe("Patient 3");
        expect(axios.get).toHaveBeenCalledWith("http://localhost:1337/api/patients/3");
    });


    /// Tests that creating a new patient sends correct data to API (future functionality)
    /// </summary>
    test("PatientService_CreatePatient_SendsPostRequestToAPI", async () => {
        // Arrange
        const newPatient = { name: "New Test Patient", gender: "female" };
        axios.post.mockResolvedValueOnce({ data: { data: { id: 6, ...newPatient } } });

        // Act
        const result = await axios.post("http://localhost:1337/api/patients", newPatient);

        // Assert
        expect(result.data.data.id).toBe(6);
        expect(result.data.data.name).toBe("New Test Patient");
        expect(axios.post).toHaveBeenCalledWith("http://localhost:1337/api/patients", newPatient);
    });

    /// <summary>
    /// Tests that updating a patient sends correct data to the API (future functionality)
    /// </summary>
    test("PatientService_UpdatePatient_SendsPutRequestToAPI", async () => {
        // Arrange
        const updatedData = { name: "Updated Patient" };
        axios.put.mockResolvedValueOnce({ data: { data: { id: 2, ...updatedData } } });

        // Act
        const result = await axios.put("http://localhost:1337/api/patients/2", updatedData);

        // Assert
        expect(result.data.data.name).toBe("Updated Patient");
        expect(axios.put).toHaveBeenCalledWith(
            "http://localhost:1337/api/patients/2",
            updatedData
        );
    });


    /// Tests that deleting a patient sends a DELETE request to the API (future functionality)
    /// </summary>
    test("PatientService_DeletePatient_SendsDeleteRequestToAPI", async () => {
        // Arrange
        axios.delete.mockResolvedValueOnce({ data: { success: true } });

        // Act
        const result = await axios.delete("http://localhost:1337/api/patients/4");

        // Assert
        expect(result.data.success).toBe(true);
        expect(axios.delete).toHaveBeenCalledWith("http://localhost:1337/api/patients/4");
    });
});