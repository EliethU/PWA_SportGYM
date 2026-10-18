jest.mock("../src/Imagen/logo-port-gym.png.png", () => "mock-logo.png");

describe("🧾 Sales Invoice Service", () => {
  test("downloadSaleInvoice - función existe", () => {
    const { downloadSaleInvoice } = require("../src/services/salesInvoice");
    expect(typeof downloadSaleInvoice).toBe("function");
  });
});
