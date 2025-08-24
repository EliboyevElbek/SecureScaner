# 🚀 Parallel Domain Scanning - SiteScaner

## Overview
SiteScaner now supports **parallel domain scanning** using Python's subprocess and threading capabilities. This significantly improves scanning performance by running multiple tools simultaneously on multiple domains.

## ✨ Key Features

### 1. Parallel Domain Processing
- **Multiple domains** are scanned simultaneously using `ThreadPoolExecutor`
- **Configurable thread count** (default: max 10 parallel scans)
- **Efficient resource utilization** without overwhelming the system

### 2. Parallel Tool Execution
Each domain is scanned with **4 security tools simultaneously**:

- 🌐 **Nmap** - Port scanning & vulnerability detection
- 💉 **SQLMap** - SQL injection testing  
- 📁 **Gobuster** - Directory/file discovery
- 🕷️ **XSStrike** - XSS vulnerability detection

### 3. Real-time Progress Tracking
- **Professional progress overlay** during scanning
- **Tool status indicators** for each scanning tool
- **Estimated completion time** display
- **Responsive design** for all devices

## 🔧 Technical Implementation

### Backend (Python/Django)
```python
# Parallel domain scanning using ThreadPoolExecutor
def perform_parallel_domain_scans(domains):
    with ThreadPoolExecutor(max_workers=min(len(domains), 10)) as executor:
        future_to_domain = {
            executor.submit(perform_domain_scan, domain): domain 
            for domain in domains if domain.strip()
        }
        
        for future in as_completed(future_to_domain):
            result = future.result()
            # Process results as they complete
```

### Tool Integration
- **Subprocess execution** for each security tool
- **Timeout handling** to prevent hanging scans
- **Error handling** for missing tools or failures
- **Output parsing** for structured results

### Frontend (JavaScript/HTML/CSS)
- **Real-time progress updates**
- **Professional UI animations**
- **Responsive design** for mobile/desktop
- **Tool result visualization**

## 📊 Performance Improvements

### Before (Sequential)
- 1 domain × 4 tools = 4 sequential operations
- 3 domains × 4 tools = 12 sequential operations
- **Total time**: Sum of all individual scan times

### After (Parallel)
- 1 domain × 4 tools = 4 parallel operations
- 3 domains × 4 tools = 12 parallel operations  
- **Total time**: Time of longest individual scan
- **Performance gain**: 3-5x faster for multiple domains

## 🛠️ Tool Requirements

### Required Tools
```
tools/
├── nmap/
│   └── nmap.exe
├── sqlmap/
│   └── sqlmap.py
├── gobuster/
│   └── gobuster.exe
├── XSStrike/
│   └── xsstrike.py
└── params/
    └── common-files.txt
```

### Tool Validation
- **Automatic detection** of available tools
- **Graceful fallback** if tools are missing
- **Clear error messages** for troubleshooting

## 🚀 Usage

### 1. Enter Domains
```
example.com
test.com
demo.org
```

### 2. Click "Tahlilni boshlash"
- **Progress overlay** appears immediately
- **Parallel scanning** begins automatically
- **Real-time status** for all tools

### 3. View Results
- **Comprehensive tool results** for each domain
- **Vulnerability details** with clear formatting
- **Professional presentation** of findings

## 🔒 Security Considerations

### Rate Limiting
- **Configurable timeouts** for each tool
- **Resource limits** to prevent abuse
- **Graceful degradation** under load

### Error Handling
- **Tool availability checks**
- **Timeout protection**
- **Comprehensive logging**

## 📱 User Experience

### Professional Design
- **Dark theme** with green accents
- **Smooth animations** and transitions
- **Responsive layout** for all devices

### Progress Feedback
- **Real-time scanning status**
- **Tool completion indicators**
- **Estimated completion times**

## 🚀 Future Enhancements

### Planned Features
- **Custom tool configurations**
- **Scan scheduling** capabilities
- **Result export** options
- **Advanced filtering** and search

### Performance Optimizations
- **Dynamic thread allocation**
- **Tool result caching**
- **Background processing**

## 📋 System Requirements

### Minimum
- **Python 3.8+**
- **Django 3.2+**
- **Windows 10+** (for .exe tools)
- **4GB RAM** (recommended)

### Recommended
- **Python 3.10+**
- **Django 4.0+**
- **Windows 11**
- **8GB+ RAM**
- **SSD storage**

## 🐛 Troubleshooting

### Common Issues
1. **Tools not found**: Check tool paths in `tools/` directory
2. **Permission errors**: Run as administrator if needed
3. **Timeout issues**: Adjust timeout values in code
4. **Memory problems**: Reduce parallel thread count

### Debug Mode
Enable detailed logging by setting:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📞 Support

For technical support or feature requests:
- **Documentation**: Check this README
- **Code comments**: Inline documentation in source
- **Error logs**: Console output during scanning

---

**SiteScaner Parallel Scanning** - Professional security scanning made fast and efficient! 🚀
