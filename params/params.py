import re
import requests
from urllib.parse import urljoin, urldefrag
import argparse
import sys

class ParamSpider:
    def __init__(self, domain, cookies=None):
        self.domain = domain if domain.startswith("http") else f"https://{domain}"
        self.visited_links = set()
        self.sqlmap_urls = set()
        self.sessid = requests.Session()

        # Laravel cookie va XSRF-TOKEN ni qo‘shish
        if cookies:
            try:
                cookie_dict = {}
                for cookie in cookies.split(";"):
                    name, value = cookie.strip().split("=", 1)
                    cookie_dict[name.strip()] = value.strip()
                self.sessid.cookies.update(cookie_dict)
            except Exception as e:
                print(f"[!] Cookie formatda xatolik: {e}")

    def resp_request(self, url):
        try:
            return self.sessid.get(url, timeout=5)
        except requests.RequestException:
            return None

    def all_links(self, html, base_url):
        pattern = r'<a[^>]+href=["\']?([^"\'>\s]+)["\']?'
        raw_links = re.findall(pattern, html)
        full_links = [urldefrag(urljoin(base_url, link)).url for link in raw_links]
        param_links = set(
            l for l in full_links
            if "?" in l and "=" in l and "logout" not in l and l.startswith(self.domain)
        )
        return list(param_links)

    def crawl(self, url):
        if url in self.visited_links:
            return list(self.sqlmap_urls)
        self.visited_links.add(url)
        response = self.resp_request(url)
        if not response:
            return list(self.sqlmap_urls)
        html = response.content.decode(errors="ignore")
        links = self.all_links(html, url)
        for link in links:
            if link not in self.sqlmap_urls:
                self.sqlmap_urls.add(link)
                print(f"[+] {link}")
        for link in links:
            if link not in self.visited_links:
                self.crawl(link)
        return list(self.sqlmap_urls)

if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser(description="Simple param crawler with Laravel cookie support")
        parser.add_argument("-d", "--domain", required=True, help="Target domain to crawl (e.g. example.com)")
        parser.add_argument("-c", "--cookie", required=False, help="Cookies (e.g. 'laravel_session=abc; XSRF-TOKEN=xyz')")
        args = parser.parse_args()

        spider = ParamSpider(args.domain, cookies=args.cookie)
        print(f"\n[i] Crawling {args.domain} ...\n")
        found = spider.crawl(spider.domain)
        print(f"\n[i] Found {len(found)} parameterized URLs.")
    
    except KeyboardInterrupt:
        print("\n[!] Stopped (Ctrl + C).")
        sys.exit(0)
