"""Download openly licensed photographs and generate the attribution manifest.

Requires Pillow. Re-run only when intentionally refreshing bundled photography.
"""
from datetime import date
import html
import io
import json
from pathlib import Path
import re
import time
import sys
import urllib.parse
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
QUERIES = {
    'hero': 'Dubai skyline at night',
    'burj': 'Burj Khalifa',
    'mall': 'Dubai Mall',
    'fountain': 'Dubai Fountain',
    'aquarium': 'Dubai Aquarium',
    'skyviews': 'Downtown Dubai',
    'opera': 'Dubai Opera',
    'canal': 'Dubai Water Canal',
    'future': 'Museum of the Future Dubai',
    'frame': 'Dubai Frame',
    'zabeel': 'Zabeel Park',
    'citywalk': 'City Walk Dubai',
    'greenplanet': 'Green Planet',
    'mosque': 'Jumeirah Mosque',
    'kite': 'Kite Beach',
    'sunset': 'Burj Al Arab beach',
    'madinat': 'Madinat Jumeirah',
    'palm': 'Palm Jumeirah',
    'atlantis': 'Atlantis, The Palm',
    'aquaventure': 'Aquaventure',
    'marina': 'Dubai Marina',
    'jbr': 'Jumeirah Beach Residence',
    'bluewaters': 'Bluewaters',
    'ain': 'Ain Dubai',
    'harbour': 'Dubai Harbour',
    'fahidi': 'Al Fahidi',
    'seef': 'Al Seef',
    'abra': 'Dubai Creek abra',
    'gold': 'Dubai Gold Souk',
    'shindagha': 'Al Shindagha Museum',
    'expo': 'Al Wasl Plaza',
    'ja': 'Jebel Ali Beach Hotel',
    'motiongate': 'Motiongate Dubai',
    'legoland': 'Legoland Dubai',
    'riverland': 'Riverland',
    'desert': 'Dubai desert dunes',
    'hatta': 'Hatta dam',
}
SELECTED_FILES = {
    'hero': 'Dubai skyline unsplash.jpg',
    'burj': 'Burj Khalifa (worlds tallest building) and the Dubai skyline (25781049892).jpg',
    'mosque': 'Jumeira Mosque Dubai.jpg',
    'palm': 'Artificial Archipelagos, Dubai, United Arab Emirates ISS022-E-024940 lrg (cropped).jpg',
    'abra': 'The view of Dubai Creek.jpg',
    'opera': 'Inside the Dubai Opera.jpg',
    'future': 'Museum of the Future inside-Dubai UAE-Andres Larin.jpg',
    'kite': 'Kite Beach in Dubai.jpg',
    'sunset': 'Burj Al Arab and Jumeirah Beach (9601659067).jpg',
    'atlantis': 'Vereinigte Arabische Emirate - Atlantis on Palm Jumeirah - أتلانتيس في نخلة جميرا - panoramio.jpg',
    'fahidi': 'Al Fahidi 3.jpg',
    'shindagha': 'Shindagha Museum- Dubai.jpg',
    'expo': 'Evening Two at the Expo (51733837998).jpg',
    'ja': 'Jebel Ali Palm Tree Court Pool 2012 - panoramio.jpg',
    'riverland': 'Riverland, Dubai at Night.jpg',
}


def fetch(url):
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'TravellingGuide/1.0 (personal travel catalogue)'})
            return urllib.request.urlopen(request, timeout=45).read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(15 * (attempt + 1))


def plain(value):
    return html.unescape(re.sub('<[^>]+>', '', value)).strip()


def download(entry):
    key, query = entry
    params = {'action': 'query', 'generator': 'search', 'gsrsearch': 'intitle:"' + query + '" filetype:bitmap',
              'gsrnamespace': 6, 'gsrlimit': 12, 'prop': 'imageinfo',
              'iiprop': 'url|extmetadata|size', 'iiurlwidth': 1600, 'format': 'json'}
    if key in SELECTED_FILES:
        params = {'action': 'query', 'titles': 'File:' + SELECTED_FILES[key], 'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiurlwidth': 1600, 'format': 'json'}
    try:
        data = json.loads(fetch('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)))
    except Exception as error:
        print(f'{key}: search unavailable: {error}', flush=True)
        return key, None
    pages = sorted(data.get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 0))
    for page in pages:
        info = page.get('imageinfo', [{}])[0]
        meta = info.get('extmetadata', {})
        license_name = plain(meta.get('LicenseShortName', {}).get('value', ''))
        if not (license_name.startswith(('CC BY', 'CC0', 'Public domain')) and 'NC' not in license_name and 'ND' not in license_name):
            continue
        title = page['title'].lower()
        if key == 'mall' and 'marina' in title or key == 'greenplanet' and 'dubai' not in title:
            continue
        if key == 'future' and any(word in title for word in ('library', 'dna', 'interior')):
            continue
        if info.get('width', 0) < 900 or info.get('height', 0) < 500:
            continue
        try:
            photo = Image.open(io.BytesIO(fetch(info.get('thumburl', info['url'])))).convert('RGB')
            assets = ROOT / 'public' / 'images'
            assets.mkdir(parents=True, exist_ok=True)
            for width in (640, 1280):
                copy = photo.copy()
                copy.thumbnail((width, width))
                copy.save(assets / f'{key}-{width}.webp', 'WEBP', quality=82, method=6)
            print(f'{key}: {page["title"]} [{license_name}]', flush=True)
            return key, {'src': f'images/{key}-1280.webp', 'small': f'images/{key}-640.webp',
                         'alt': query, 'author': plain(meta.get('Artist', {}).get('value', 'Unknown')),
                         'license': license_name, 'licenseUrl': meta.get('LicenseUrl', {}).get('value', 'https://commons.wikimedia.org/wiki/Commons:Licensing').replace('http://', 'https://'),
                         'sourceUrl': info['descriptionurl'], 'checkedAt': date.today().isoformat(),
                         'adaptation': 'Resized and converted to WebP'}
        except Exception as error:
            print(f'{key}: candidate failed: {error}', flush=True)
    print(f'{key}: no suitable photograph', flush=True)
    return key, None


if __name__ == '__main__':
    if '--candidates' in sys.argv:
        for key, query in QUERIES.items():
            if key not in ('future', 'opera', 'kite', 'atlantis', 'difc', 'fahidi', 'shindagha', 'expo', 'terra', 'ja', 'riverland', 'sunset'):
                continue
            query = query + ' Dubai' if key in ('kite', 'terra', 'riverland') else query
            params = {'action': 'query', 'list': 'search', 'srsearch': query, 'srnamespace': 6, 'srlimit': 8, 'format': 'json'}
            data = json.loads(fetch('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)))
            print(key, [p['title'] for p in data['query']['search']], flush=True)
            time.sleep(2)
        sys.exit()
    path = ROOT / 'src' / 'content' / 'images.json'
    path.parent.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    for entry in QUERIES.items():
        refresh = sys.argv[sys.argv.index('--only') + 1].split(',') if '--only' in sys.argv else list(SELECTED_FILES)
        if '--only' in sys.argv and entry[0] not in refresh:
            continue
        if entry[0] in manifest and not ('--refresh' in sys.argv and entry[0] in refresh):
            continue
        key, asset = download(entry)
        if asset:
            manifest[key] = asset
            path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        time.sleep(3)
