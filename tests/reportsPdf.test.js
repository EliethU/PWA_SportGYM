jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(),
}));

jest.mock("../src/assets/database/firebaseconfig", () => ({ db: {} }));

describe("📊 Reports PDF Service", () => {
  test("downloadReportPdf - función existe", () => {
    const { downloadReportPdf } = require("../src/services/reportsPdf");
    expect(typeof downloadReportPdf).toBe("function");
  });
});
