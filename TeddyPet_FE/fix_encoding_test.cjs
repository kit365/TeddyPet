const fs = require('fs');

const fixEncoding = (str) => {
    try {
        return Buffer.from(str, 'latin1').toString('utf8');
    } catch (e) {
        return str;
    }
};

const text = "ThÃº cÆ°ng & dá»‹ch vá»¥";
console.log("Original:", text);
console.log("Fixed:", fixEncoding(text));
