# SiteScaner - Real-Time Tool Output

## Real-Time Tool Output Funksionalligi

Bu funksionallik "Tahlilni boshlash" tugmasi bosilgandan keyin "Jarayon" tugmasini bosganda tool nomlari chiqadi va "batafsil" tugmasini bosganda har bir tool uchun real-time natijalar ko'rsatiladi.

### Qanday Ishaydi

1. **"Tahlilni boshlash" tugmasi** - Domainlarni kiritish va tahlilni boshlash
2. **"Jarayon" tugmasi** - Mavjud tool'larni ko'rsatish
3. **"batafsil" tugmasi** - Har bir tool uchun real-time output ko'rsatish

### Real-Time Output Xususiyatlari

- **Server-Sent Events (SSE)** yordamida real-time streaming
- Har bir tool uchun alohida output oynasi
- Terminal natijalarini real vaqtda ko'rsatish
- Xatoliklar va muvaffaqiyat xabarlarini ko'rsatish
- Output'ni tozalash imkoniyati

### Qo'llab-quvvatlanadigan Tool'lar

- **Nmap** - Port scanning va xavfsizlik tekshiruv
- **SQLMap** - SQL injection tekshiruv
- **Gobuster** - Directory enumeration
- **XSStrike** - XSS vulnerability tekshiruv

### Texnik Tafsilotlar

#### Backend (Django)
- `stream_tool_output()` - Asosiy streaming endpoint
- `stream_nmap_output()` - Nmap real-time output
- `stream_sqlmap_output()` - SQLMap real-time output
- `stream_gobuster_output()` - Gobuster real-time output
- `stream_xsstrike_output()` - XSStrike real-time output

#### Frontend (JavaScript)
- `startToolStreaming()` - Real-time streaming boshlash
- `appendToolOutput()` - Output'ni qo'shish
- `createToolResultsSection()` - Tool natijalari oynasini yaratish

#### CSS Styling
- Professional dark theme
- Terminal-style output display
- Scrollable output container
- Color-coded message types

### URL Endpoint

```
/scaner/stream-tool-output/<domain>/<tool_type>/
```

### Misol

1. Domain kiritish: `example.com`
2. "Tahlilni boshlash" tugmasini bosish
3. "Jarayon" tugmasini bosish
4. Tool nomlarini ko'rish
5. "batafsil" tugmasini bosish
6. Real-time natijalarni ko'rish

### Xavfsizlik

- CSRF protection
- Input validation
- Tool path verification
- Timeout protection (5 daqiqa)

### O'rnatish

1. Django serverini ishga tushiring
2. Tool'lar `tools/` papkasida bo'lishi kerak
3. Browser'da EventSource qo'llab-quvvatlanadi

### Xatoliklar

Agar tool topilmasa, xatolik xabari ko'rsatiladi:
- "Nmap tool topilmadi. Iltimos, tools/nmap/ papkasini tekshiring."
- "SQLMap tool topilmadi. Iltimos, tools/sqlmap/ papkasini tekshiring."
- va hokazo...

### Natija

Endi foydalanuvchilar har bir tool'ning real-time natijalarini ko'ra oladi, xuddi terminalda ishlatgandek. Bu xavfsizlik tahlilida juda foydali, chunki natijalar darhol ko'rsatiladi va foydalanuvchi jarayonni kuzatib boradi.

