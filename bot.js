const axios = require('axios');
const Telegraf = require('telegraf');

// Inisialisasi bot dengan token
const bot = new Telegraf('7474983677:AAH5LfA8JE-ke4b8yyI5EUeWZC-r6PsT74U');

// Fungsi untuk membersihkan nomor telepon dari "AAA" dan format yang tidak sesuai
const cleanPhoneNumber = (fileContent) => {
    return fileContent.replace(/AAA/g, '').trim();
};

// Fungsi untuk memeriksa apakah file hanya berisi nomor telepon
const checkForNumbersOnly = (fileContent) => {
    const phoneNumberRegex = /\+?\d{1,3}?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    const numbers = fileContent.match(phoneNumberRegex);
    return numbers && numbers.length > 0 && !checkForKeywords(fileContent);
};

// Fungsi untuk memeriksa apakah file berisi keyword
const checkForKeywords = (fileContent) => {
    const keywords = ['BOSS', 'BABU', 'ADMIN', 'NAVY', 'MEMBER'];
    return keywords.some(keyword => fileContent.toUpperCase().includes(keyword));
};

// Fungsi untuk menangani file yang diunggah
const handleFile = async (fileId) => {
    try {
        const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileId}`;
        const response = await axios.get(url);
        const fileContent = response.data;

        // Log isi file untuk debugging
        console.log("Isi file:", fileContent);

        // Bersihkan nomor telepon dengan AAA
        const cleanedContent = cleanPhoneNumber(fileContent);

        if (checkForNumbersOnly(cleanedContent)) {
            // Panggil fungsi 'App' untuk memproses nomor
            const resultFromApp = App(cleanedContent);  // Menjalankan fungsi App
            return { type: 'numberOnly', content: resultFromApp.message };  // Pastikan ada 'message' dari fungsi App
        } else if (checkForKeywords(cleanedContent)) {
            // Panggil fungsi 'AutoDetectKeyword' untuk memproses keyword
            const resultFromKeyword = AutoDetectKeyword(cleanedContent);  // Menjalankan fungsi AutoDetectKeyword
            return { type: 'keywordDetected', content: resultFromKeyword.message };  // Pastikan ada 'message' dari fungsi AutoDetectKeyword
        } 

        return { type: 'unknown', content: cleanedContent };

    } catch (error) {
        console.error('Error fetching file:', error);
        return { type: 'error', content: null };
    }
};

// Fungsi untuk memproses nomor telepon
const App = (fileContent) => {
    // Logika pemrosesan nomor telepon di sini
    const phoneNumberRegex = /\+?\d{1,3}?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    const numbers = fileContent.match(phoneNumberRegex);
    return {
        message: numbers ? numbers.join(', ') : 'Tidak ada nomor telepon yang valid ditemukan.'
    };
};

// Fungsi untuk mendeteksi keyword
const AutoDetectKeyword = (fileContent) => {
    const keywords = ['BOSS', 'BABU', 'ADMIN', 'NAVY', 'MEMBER'];
    const detectedKeywords = keywords.filter(keyword => fileContent.toUpperCase().includes(keyword));

    return {
        message: detectedKeywords.length > 0 ? `Keyword ditemukan: ${detectedKeywords.join(', ')}` : 'Tidak ada keyword yang dikenali.'
    };
};

// Event ketika dokumen diunggah
bot.on('document', async (ctx) => {
    const fileId = ctx.message.document.file_id;

    // Ambil file dan proses isinya
    const result = await handleFile(fileId);

    if (result.type === 'numberOnly') {
        // Panggil fungsi dari 'App' untuk memproses nomor dan balas hasilnya
        ctx.reply(`Ditemukan nomor telepon: ${result.content}`);
    } else if (result.type === 'keywordDetected') {
        // Panggil fungsi dari 'AutoDetectKeyword' untuk memproses keyword dan balas hasilnya
        ctx.reply(`Ditemukan keyword: ${result.content}`);
    } else {
        // Jika tidak ada keyword atau nomor yang dikenali
        ctx.reply('File ini tidak dikenali.');
    }
});

// Jalankan bot
bot.launch();
