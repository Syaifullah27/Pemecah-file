from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, CallbackContext
import os
import asyncio

# Fungsi untuk memeriksa apakah file hanya berisi nomor kontak atau ada keywordnya
def process_file(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
        # Logika untuk mendeteksi keyword
        if "BOSS" in content or "BABU" in content:
            return 'AutoDetectKeyword'
        else:
            return 'App'

# Fungsi untuk konversi TXT ke VCF
def convert_to_vcf(file_path, output_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    with open(output_path, 'w') as vcf_file:
        vcf_file.write("BEGIN:VCARD\n")
        vcf_file.write("VERSION:3.0\n")
        for line in lines:
            if line.strip():  # hanya menulis baris yang tidak kosong
                vcf_file.write(f"FN:{line.strip()}\n")
                vcf_file.write(f"TEL;TYPE=CELL:{line.strip()}\n")
        vcf_file.write("END:VCARD\n")

# Fungsi untuk menangani pesan dengan file yang dilampirkan
async def handle_document(update: Update, context: CallbackContext) -> None:
    file = await update.message.document.get_file()
    file_path = f"./{file.file_id}.txt"
    await file.download_to_drive(file_path)

    # Periksa apakah file berisi keyword atau hanya nomor kontak
    processing_function = process_file(file_path)

    if processing_function == 'AutoDetectKeyword':
        await update.message.reply_text("File ini memiliki keyword, menggunakan fitur AutoDetectKeyword.")
        # Tambahkan logika untuk AutoDetectKeyword di sini
    else:
        await update.message.reply_text("File ini hanya memiliki nomor kontak, menggunakan fitur App.")
        # Konversi file TXT ke VCF
        vcf_file_path = f"./{file.file_id}.vcf"
        convert_to_vcf(file_path, vcf_file_path)
        with open(vcf_file_path, 'rb') as vcf_file:
            await update.message.reply_document(vcf_file)

    # Hapus file sementara
    os.remove(file_path)
    os.remove(vcf_file_path)

# Fungsi untuk memulai bot
async def start(update: Update, context: CallbackContext) -> None:
    await update.message.reply_text('Halo! Kirimkan file .txt dan aku akan memprosesnya.')

async def main():
    # Masukkan token yang kamu dapatkan dari BotFather di sini
    TOKEN = "7474983677:AAH5LfA8JE-ke4b8yyI5EUeWZC-r6PsT74U"

    # Buat aplikasi bot
    application = Application.builder().token(TOKEN).build()

    # Command handler untuk memulai bot
    application.add_handler(CommandHandler("start", start))

    # Message handler untuk file yang dilampirkan
    application.add_handler(MessageHandler(filters.Document.ALL & filters.Document.MimeType("text/plain"), handle_document))

    # Jalankan bot dengan polling
    await application.initialize()
    await application.start()
    await application.updater.start_polling()
    await application.updater.idle()

# Pengecekan apakah event loop sudah berjalan
if __name__ == '__main__':
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Jika event loop sudah berjalan, gunakan event loop yang ada
            loop.create_task(main())
        else:
            # Jika tidak ada event loop yang berjalan, buat event loop baru
            asyncio.run(main())
    except RuntimeError as e:
        print(f"Error: {e}")
