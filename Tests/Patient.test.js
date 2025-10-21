
test("2 + 2 moet gelijk zijn aan 4", () => {
    //Arange
    const a = 2;
    const b = 2;

    //Act
    const result = a + b;

    //Assert
    expect(result).toBe(4);
});