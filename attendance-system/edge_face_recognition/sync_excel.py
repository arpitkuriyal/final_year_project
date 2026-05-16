import gdown
import pandas as pd
import requests
import os
import re

EXCEL_URL = 'https://docs.google.com/spreadsheets/d/1Nv3cKZLBcBLH0JeLmRTJLOrgHWhIBOV94OyW-mjk0FY/export?format=xlsx'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_PATH = os.path.join(BASE_DIR, "..", "form_responses.xlsx")
IMAGE_SAVE_DIR = os.path.join(BASE_DIR, "..", "student's faces")

def download_latest_excel():
    gdown.download(EXCEL_URL, EXCEL_PATH, quiet=False)

def load_excel():
    return pd.read_excel(EXCEL_PATH)

def get_student_details(student_id, df):
    try:
        student_id = int(student_id)
        row = df[df["Id"] == student_id]
        if not row.empty:
            return row.iloc[0]["Name"], row.iloc[0]["Branch"], row.iloc[0]["Batch"]
    except:
        pass
    return "Unknown", "Unknown", "Unknown"

def convert_google_drive_link(link):
    # Extract file ID from Google Drive URL
    match = re.search(r'id=([^&]+)', link)
    if not match:
        match = re.search(r'/d/([^/]+)', link)
    if match:
        file_id = match.group(1)
        return f"https://drive.google.com/uc?export=download&id={file_id}"
    return None

def sanitize_name(name):
    # Remove extra spaces and split into parts
    name_parts = str(name).strip().split()
    if len(name_parts) >= 2:
        first_name = name_parts[0]
        last_name = name_parts[-1]
    elif len(name_parts) == 1:
        first_name = name_parts[0]
        last_name = "X"
    else:
        first_name = "Unknown"
        last_name = "X"
    return first_name, last_name

def download_all_student_images(df, save_dir="student_images"):
    os.makedirs(save_dir, exist_ok=True)

    for _, row in df.iterrows():
        student_id = row.get("Id")
        name = row.get("Name")
        photo_link = row.get("Photo (name it as ID_Firstname Surname)")

        if pd.isna(photo_link) or pd.isna(student_id) or pd.isna(name):
            continue

        first_name, last_name = sanitize_name(name)
        file_name = f"{int(student_id)}_{first_name}_{last_name}.jpg"
        file_path = os.path.join(save_dir, file_name)

        # ✅ Skip download if file already exists
        if os.path.exists(file_path):
            print(f"[⏭] Skipped (already exists): {file_name}")
            continue

        download_url = convert_google_drive_link(photo_link)
        if not download_url:
            print(f"[!] Invalid link for ID {student_id}")
            continue

        try:
            response = requests.get(download_url, stream=True)
            if response.status_code == 200:
                with open(file_path, 'wb') as f:
                    for chunk in response.iter_content(1024):
                        f.write(chunk)
                print(f"[✓] Downloaded: {file_name}")
            else:
                print(f"[✗] HTTP error {response.status_code} for ID {student_id}")
        except Exception as e:
            print(f"[!] Failed to download for ID {student_id}: {e}")
                        
if __name__ == "__main__":
    download_latest_excel()
    df = load_excel()

    print("Student Details from Excel:\n")
    for idx, row in df.iterrows():
        student_id = row.get("Id")
        if pd.isna(student_id):
            continue
        name, branch, batch = get_student_details(student_id, df)
        print(f"ID: {student_id} | Name: {name} | Branch: {branch} | Batch: {batch}")

    download_all_student_images(df, IMAGE_SAVE_DIR)
