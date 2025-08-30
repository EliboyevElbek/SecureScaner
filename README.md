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
    'key': '-u',
    'type': 'file',
    'placeholder': 'Masalan: /usr/share/wordlists/dirb/common.txt'
}
```

## 🛑 **Global Stop Flag Tizimi**

### 🎯 **Asosiy Maqsad**
Global stop flag tizimi barcha parallel ishlayotgan scan'larni bir vaqtda to'xtatish imkonini beradi. Bu xususiyat foydalanuvchiga scan jarayonini to'liq nazorat qilish imkonini beradi.

### 🔧 **Texnik Tuzilma**

#### 1. **Global Flag**
```python
import threading

# Global stop flag - barcha scan'larni to'xtatish uchun
global_stop_flag = threading.Event()
```

#### 2. **Worker Funksiyasida Tekshirish**
```python
def run_single_tool(tool_type, command):
    # Stop flag tekshirish
    if global_stop_flag.is_set():
        print(f"⏹️ {tool_type.upper()} to'xtatildi - global stop flag yoqildi")
        return tool_type, False, "To'xtatildi - global stop flag yoqildi"
    
    # ... tool'ni bajarish kodi ...
```

#### 3. **Real-time Output va Stop Flag**
```python
# Real-time output o'qish va stop flag tekshirish
while True:
    # Stop flag tekshirish
    if global_stop_flag.is_set():
        proc.terminate()
        return tool_type, False, "To'xtatildi - global stop flag yoqildi"
    
    # Output o'qish
    output_line = proc.stdout.readline()
    # ... boshqa kod ...
```

#### 4. **To'xtatish Funksiyasi**
```python
def stop_all():
    """Barcha scan'larni to'xtatish - global stop flag orqali"""
    global global_stop_flag
    global_stop_flag.set()
    
    # Barcha running task'larni to'xtatish
    for task_key, pid in list(running_tasks.items()):
        try:
            proc = psutil.Process(pid)
            proc.terminate()
        except Exception as e:
            print(f"⚠️ {task_key} to'xtatishda xatolik: {e}")
    
    return True
```

#### 5. **Flag'ni Qaytadan Tozalash**
```python
def reset_stop_flag():
    """Global stop flag'ni qaytadan tozalash - yangi scan uchun"""
    global global_stop_flag
    global_stop_flag.clear()
```

### 🌐 **Frontend Integratsiyasi**

#### 1. **Stop Button**
```html
<button class="btn btn-medium-large btn-danger" id="stopButton" onclick="stopAllTools()" style="display: none;">
    Tahlilni to'xtatish
</button>
```

#### 2. **JavaScript Funksiyasi**
```javascript
function stopAllTools() {
    // Backend'ga so'rov yuborish
    fetch('/scaner/stop-all/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('✅ Barcha scan\'lar muvaffaqiyatli to\'xtatildi!', 'success');
        }
    });
}
```

### 📡 **API Endpoint'lar**

#### 1. **Stop All Scans**
```
POST /scaner/stop-all/
```
Barcha scan'larni to'xtatish uchun global stop flag'ni yoqadi.

#### 2. **Reset Stop Flag**
```
POST /scaner/reset-stop-flag/
```
Global stop flag'ni qaytadan tozalaydi - yangi scan'lar uchun.

### ✅ **Afzalliklari**

1. **Tezkor To'xtatish** - Barcha parallel ishlayotgan tool'lar darhol to'xtaydi
2. **Xavfsizlik** - Process'lar to'g'ri tarzda to'xtatiladi va resurslar tozalanadi
3. **Real-time Monitoring** - Har bir tool output'ida stop flag tekshiriladi
4. **Avtomatik Reset** - Yangi scan boshlanishida flag avtomatik tozalanadi
5. **Frontend Integratsiya** - Foydalanuvchi interfeysi orqali oson boshqarish

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

