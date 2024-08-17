from flask import Flask, jsonify, request
from bs4 import BeautifulSoup
import requests
import json
import time

app = Flask(__name__)

# Load the JSON file with URLs and CSS selectors
with open('fragrances.json') as f:
    data = json.load(f)

def scrape_price(url, selector):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        price_element = soup.select_one(selector)
        return price_element.get_text(strip=True) if price_element else None
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

@app.route('/api/prices', methods=['GET'])
def get_prices():
    results = {}
    for fragrance, sites in data.items():
        results[fragrance] = {}
        for site, info in sites.items():
            if info['url'] and info['price_selector']:
                price = scrape_price(info['url'], info['price_selector'])
                results[fragrance][site] = price
            else:
                results[fragrance][site] = None
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
