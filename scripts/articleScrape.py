import requests
from bs4 import BeautifulSoup
import json

# URL of the Wikipedia page to scrape
url = 'https://en.wikipedia.org/wiki/Wikipedia:Popular_pages'
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

# Find all tables on the page
tables = soup.find_all('table')

titles = []

for table in tables:
    # Check if the table has at least one row and the first row has three cells
    rows = table.find_all('tr')
    if len(rows) > 1:
        header_cells = rows[0].find_all('th')
        # Check if the header has three columns (Rank, Article, Words)
        if len(header_cells) == 3:
            # This is likely our target table
            print("Target table found.")
            # Skip the header row and iterate over the data rows
            for row in rows[1:]:
                cells = row.find_all('td')
                if len(cells) >= 2:
                    a_tag = cells[1].find('a')
                    if a_tag and 'href' in a_tag.attrs:
                        href = a_tag['href']
                        # Exclude links that are not to articles
                        if href.startswith('/wiki/') and not href.startswith('/wiki/Wikipedia:'):
                            title = a_tag.get_text().strip()
                            titles.append(title)

# Remove duplicates
titles = list(set(titles))

# Save the titles to a JSON file
with open('article_titles.json', 'w') as f:
    json.dump(titles, f, indent=2)

print(f'Total articles extracted: {len(titles)}')
