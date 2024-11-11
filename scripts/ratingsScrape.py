import json
import csv
import time
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.firefox.options import Options
import itertools

# Path to the JSON file containing article titles
json_file_path = "src/components/article_titles.json"

# Load article titles from the JSON file
with open(json_file_path, 'r') as file:
    article_titles = json.load(file)

# Calculate the total number of pairings
total_pairs = sum(1 for _ in itertools.combinations(article_titles, 2))

# Initialize CSV file with headers
with open('ratings.csv', mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["Source", "Target", "Jumps", "Path Length"])

# Set up Selenium options for headless mode
options = Options()
options.headless = True  # Run in headless mode for faster performance

# Set up Selenium WebDriver for Firefox
driver = webdriver.Firefox(options=options)  # Ensure geckodriver is in your PATH

def process_pair(source, target):
    base_url = "https://www.sixdegreesofwikipedia.com/"
    url = f"{base_url}?source={source}&target={target}"
    driver.get(url)

    try:
        # Wait for the button to be clickable and click it
        wait = WebDriverWait(driver, 20)
        button = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "sc-blHHSb.sc-drVZOg.bkogKd.lhyJDB")))
        button.click()

        # Wait specifically for the <p> tag containing "Found" to appear
        wait.until(EC.presence_of_element_located((By.XPATH, "//p[contains(text(), 'Found')]")))

        # Locate and clean the output from the <b> tags within the <p> tag
        path_count = driver.find_element(By.XPATH, "//p[contains(text(), 'Found')]/b[1]").text.strip().replace(" paths", "")
        degree_count = driver.find_element(By.XPATH, "//p[contains(text(), 'Found')]/b[2]").text.strip().replace(" degrees", "")
        
        return (source, target, path_count, degree_count)

    except Exception as e:
        print(f"Error processing pair {source} -> {target}: {e}")
        return (source, target, "Error", "Error")

# Start the timer
start_time = datetime.now()
end_time = start_time + timedelta(minutes=10)
processed_count = 0  # Track the number of successfully processed pairs

# Process each pair sequentially with a short delay between requests
with open('ratings.csv', mode='a', newline='') as file:
    writer = csv.writer(file)
    for source, target in itertools.combinations(article_titles, 2):
        if datetime.now() >= end_time:
            print("Time limit of 10 minutes reached.")
            break

        result = process_pair(source, target)
        writer.writerow(result)
        processed_count += 1

        # Respectful delay between requests
        time.sleep(1)  # Adjust based on responsiveness; 1-2 seconds is generally safe

# Close the browser
driver.quit()

# Calculate estimated time remaining
elapsed_time = (datetime.now() - start_time).total_seconds()
pairs_per_minute = processed_count / (elapsed_time / 60)
remaining_pairs = total_pairs - processed_count
estimated_minutes_left = remaining_pairs / pairs_per_minute if pairs_per_minute > 0 else "Unknown"

# Display results
print(f"Total pairs processed in 10 minutes: {processed_count}")
print(f"Total number of pairs: {total_pairs}")
print(f"Pairs per minute: {pairs_per_minute:.2f}")
print(f"Estimated time remaining: {estimated_minutes_left:.2f} minutes")
