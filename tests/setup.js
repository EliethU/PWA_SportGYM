import '@testing-library/jest-dom';

const { TextDecoder, TextEncoder } = require("util");

if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;
