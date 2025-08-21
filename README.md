# SiteScaner - Professional Security Scanner

## Tavsif

SiteScaner - bu domain va veb-saytlarni xavfsizlik nuqtai nazaridan tahlil qilish uchun professional dastur. U turli xil xavfsizlik tool'larini integratsiya qiladi va natijalarni saqlaydi.

## Asosiy Xususiyatlar

### 🔍 Domain Tahlil
- Ko'p domainlarni bir vaqtda tahlil qilish
- IP manzil, DNS, SSL va xavfsizlik sarlavhalarini tekshirish
- Natijalarni ma'lumotlar bazasida saqlash

### 🛠️ Tool Integratsiyasi
- **SQLMap** - SQL injection testlari
- **Nmap** - Tarmoq va port skanerlash
- **XSStrike** - XSS zaifliklarini aniqlash
- **Gobuster** - Papka va fayllarni topish

### 💾 Kesh va Saqlash
- Domain va tool buyruqlarini saqlash
- Checkbox orqali tool parametrlarini tanlash
- O'zgarishlar o'chirilmaguncha saqlanib turishi
- Professional admin panel

## O'rnatish

### Talablar
- Python 3.8+
- Django 4.0+
- SQLite (default)

### O'rnatish qadamlari

1. **Loyihani yuklab olish**
```bash
git clone <repository-url>
cd SiteScaner
```

2. **Virtual environment yaratish**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

3. **Kerakli paketlarni o'rnatish**
```bash
pip install -r requirements.txt
```

4. **Ma'lumotlar bazasini yaratish**
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Superuser yaratish**
```bash
python manage.py createsuperuser
```

6. **Server ni ishga tushirish**
```bash
python manage.py runserver
```

## Foydalanish

### 1. Domain Kiritish
- `/scaner/` sahifasiga o'ting
- Domain nomlarini kiriting (har qatorda bitta)
- "Tayyorlash" tugmasini bosing

### 2. Tool Parametrlarini Tanlash
- Har bir domain uchun "Tahrirlash" tugmasini bosing
- Tool'lar ro'yxatida "parametrlari" tugmasini bosing
- Kerakli parametrlarni checkbox orqali tanlang
- Parametrlar avtomatik saqlanadi

### 3. Tahlilni Boshlash
- "Tahlilni boshlash" tugmasini bosing
- Natijalar `/scaner/history/` sahifasida ko'rsatiladi

## Ma'lumotlar Bazasi Strukturasi

### KeshDomain
- `domain_name` - Domain nomi
- `tool_commands` - Tool buyruqlari (JSON)
- `created_at` - Yaratilgan sana
- `updated_at` - Yangilangan sana
- `is_active` - Faol holati

### DomainToolConfiguration
- `domain` - Domain havolasi
- `tool_type` - Tool turi
- `base_command` - Asosiy buyruq
- `selected_parameters` - Tanlangan parametrlar
- `final_command` - Yakuniy buyruq

## API Endpoint'lar

### Domain Boshqaruvi
- `POST /scaner/save-domains/` - Domainlarni saqlash
- `POST /scaner/delete-domain/` - Domain o'chirish
- `POST /scaner/update-domain/` - Domain tahrirlash
- `POST /scaner/clear-all-domains/` - Barcha domainlarni o'chirish

### Tool Konfiguratsiyasi
- `GET /scaner/get-domain-tools-preview/` - Tool preview
- `POST /scaner/save-domain-tool-config/` - Tool konfiguratsiyasini saqlash
- `GET /scaner/get-domain-tool-config/` - Tool konfiguratsiyasini olish

## Xavfsizlik

- CSRF token himoyasi
- Input validatsiyasi
- SQL injection himoyasi
- XSS himoyasi

## Rivojlantirish

### Yangi Tool Qo'shish
1. `scaner/models.py` da Tool modeliga qo'shish
2. `scaner/views.py` da tool logikasini qo'shish
3. Frontend da tool parametrlarini ko'rsatish

### Yangi Xususiyat Qo'shish
1. Model yaratish
2. View funksiyasini yozish
3. URL pattern qo'shish
4. Frontend interfeysini yaratish

## Litsenziya

Bu loyiha MIT litsenziyasi ostida tarqatiladi.

## Aloqa

Savollar va takliflar uchun issue yarating yoki pull request yuboring.

---

**Eslatma**: Bu dastur faqat o'quv va test maqsadlarida ishlatilishi kerak. Real tizimlarda foydalanishdan oldin tegishli ruxsatlarni oling.

