describe("🍽️ Receta PDF Service", () => {
  test("downloadRecipePdf - función existe", () => {
    const { downloadRecipePdf } = require("../src/services/recetaPdf");
    expect(typeof downloadRecipePdf).toBe("function");
  });
});
