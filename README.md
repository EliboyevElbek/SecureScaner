# SiteScaner - Veb Xavfsizlik Tahlil Vositasi

SiteScaner - bu veb saytlar va tarmoq xavfsizligini tahlil qilish uchun mo'ljallangan professional vosita. U turli xil xavfsizlik tool'larini birlashtirib, samarali va xavfsiz tahlil qilish imkonini beradi.

## Asosiy Xususiyatlar

### 🔍 **Domain Tahlili**
- DNS yozuvlarini tekshirish
- IP manzilni aniqlash
- SSL sertifikat ma'lumotlari
- Xavfsizlik sarlavhalarini tekshirish

### 🛠️ **Integratsiya qilingan Tool'lar**
- **Nmap** - Tarmoq skanerlash va portlarni topish
- **SQLMap** - SQL injection va ma'lumotlar bazasi ekspluatatsiyasi
- **XSStrike** - XSS (Cross-Site Scripting) aniqlash
- **Gobuster** - Papka va fayllarni topish

### ⚙️ **Tool Parametrlari Boshqaruvi**
- **Checkbox parametrlar** - Bayroq parametrlar (--help, --verbose)
- **Input parametrlar** - Qiymat kiritish kerak bo'lgan parametrlar
- **Dinamik buyruq yaratish** - Tanlangan parametrlar asosida
- **Real-time validatsiya** - Parametr qiymatlarini tekshirish

## Yangi Tuzilma: tools_config.py

### 🎯 **Asosiy Maqsad**
`tools_config.py` fayli har bir tool uchun batafsil konfiguratsiya ma'lumotlarini saqlaydi. Bu fayl quyidagi strukturani o'z ichiga oladi:

```python
TOOLS_DATA = {
    'sqlmap': {
        'name': 'SQLMap',
        'description': 'SQL injection va ma\'lumotlar bazasini ekspluatatsiya qilish vositasi',
        'category': 'Veb Xavfsizlik',
        'parameters': [
            {'flag': '--dbs', 'description': 'Mavjud ma\'lumotlar bazalarini ko\'rish'},
            # ... boshqa parametrlar
        ],
        'inputs': [
            {
                'key': '--level',
                'description': 'Test darajasi (1-5)',
                'placeholder': '1-5 orasida',
                'default': '1',
                'type': 'number',
                'required': False,
                'min': 1,
                'max': 5
            },
            # ... boshqa input'lar
        ],
        'examples': [
            'sqlmap -u "http://example.com/page.php?id=1" --dbs',
            # ... boshqa misollar
        ]
    }
}
```

### 🔧 **Input Parametr Turlari**

#### 1. **Number Type**
```python
{
    'key': '--level',
    'type': 'number',
    'min': 1,
    'max': 5,
    'default': '1'
}
```

#### 2. **URL Type**
```python
{
    'key': '-u',
    'type': 'url',
    'required': True,
    'placeholder': 'Masalan: http://example.com/page.php?id=1'
}
```

#### 3. **Text Type**
```python
{
    'key': '--dbms',
    'type': 'text',
    'placeholder': 'Masalan: mysql, postgresql, mssql'
}
```

#### 4. **File Type**
```python
{
    'key': '-w',
    'type': 'file',
    'placeholder': 'Masalan: /usr/share/wordlists/dirb/common.txt'
}
```

### 📊 **Funksiyalar**

- `get_tool_data(tool_name)` - Tool nomi bo'yicha ma'lumotlarni olish
- `get_tool_parameters(tool_name)` - Tool parametrlarini olish
- `get_tool_inputs(tool_name)` - Tool input'larini olish
- `get_tool_examples(tool_name)` - Tool misollarini olish
- `get_all_tools()` - Barcha tool'lar ro'yxatini olish

## Frontend Xususiyatlari

### 🎨 **Dinamik UI**
- Har bir tool uchun alohida parametr ko'rinishi
- Input field'lar turiga qarab avtomatik yaratish
- Real-time validatsiya va xatolik xabarlari

### 📝 **Buyruq Ko'rinishi**
- Tanlangan parametrlar asosida avtomatik buyruq yaratish
- Real-time yangilanish
- Nusxalash imkoniyati

### ✅ **Validatsiya**
- Majburiy maydonlarni tekshirish
- Type-specific validatsiya (number, URL)
- Min/max qiymatlarini tekshirish
- Xatolik xabarlarini ko'rsatish

## O'rnatish va Ishlatish

### 📋 **Talablar**
- Python 3.8+
- Django 3.2+
- SQLite yoki PostgreSQL

### 🚀 **O'rnatish**
```bash
# Repository ni klonlash
git clone https://github.com/username/SiteScaner.git
cd SiteScaner

# Virtual environment yaratish
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Kerakli paketlarni o'rnatish
pip install -r requirements.txt

# Database ni yaratish
python manage.py migrate

# Server ni ishga tushirish
python manage.py runserver
```

### 🌐 **Ishlatish**
1. Brauzerda `http://localhost:8000` ga kirish
2. "Tools" bo'limiga o'tish
3. Kerakli tool'ni tanlash
4. Parametrlarni sozlash
5. Buyruqni nusxalash va ishlatish

## Loyiha Tuzilishi

```
SiteScaner/
├── scaner/
│   ├── tools_config.py      # 🆕 Tool konfiguratsiyalari
│   ├── models.py            # Database modellari
│   ├── views.py             # View funksiyalari
│   └── ...
├── templates/
│   ├── tool_detail.html     # 🆕 Tool batafsil sahifasi
│   └── ...
├── static/
│   ├── css/
│   │   └── tool_detail.css  # 🆕 Tool detail styling
│   └── js/
│       └── tool_detail.js   # 🆕 Tool detail JavaScript
└── tools/                    # Tool executable fayllari
    ├── sqlmap/
    ├── nmap/
    ├── xsstrike/
    └── gobuster/
```

## Kelajakda Rejalashtirilgan Xususiyatlar

- [ ] **Yangi tool'lar qo'shish** - Oson integratsiya
- [ ] **Parametr shablonlari** - Tez-tez ishlatiladigan kombinatsiyalar
- [ ] **Natijalarni saqlash** - Tahlil natijalarini bazada saqlash
- [ ] **API integratsiyasi** - Boshqa xizmatlar bilan bog'lash
- [ ] **Plugin tizimi** - Uchinchi tomon tomonidan kengaytirish

## Xavfsizlik Eslatmalari

⚠️ **Muhim**: Bu vosita faqat o'zingizning yoki ruxsat berilgan tizimlarda ishlatilishi kerak. Boshqa odamlarning tizimlarida ruxsatsiz ishlatish qonuniy emas.

## Hissa Qo'shish

Loyihaga hissa qo'shish uchun:
1. Fork qiling
2. Feature branch yarating
3. O'zgarishlarni commit qiling
4. Pull request yuboring

## Aloqa

Savollar yoki takliflar uchun:
- GitHub Issues: [Loyiha Issues](https://github.com/username/SiteScaner/issues)
- Email: contact@example.com

## Litsenziya

Bu loyiha MIT litsenziyasi ostida tarqatiladi. Batafsil ma'lumot uchun `LICENSE` faylini ko'ring.

---

**SiteScaner** - Professional veb xavfsizlik tahlili uchun zamonaviy yechim! 🚀

