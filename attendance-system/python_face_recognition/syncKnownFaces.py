import pandas as pd
import os
import requests

EXCEL_URL = "https://docs.google.com/spreadsheets/d/1Nv3cKZLBcBLH0JeLmRTJLOrgHWhIBOV94OyW-mjk0FY/export?format=xlsx"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_PATH = os.path.join(BASE_DIR, "..", "form_responses.xlsx")
KNOWN_DIR = os.path.join(BASE_DIR, "..", "known faces")

def download_latest_excel():
    print("[SYNC] Downloading latest form responses...")
    response = requests.get(EXCEL_URL)
    if response.status_code == 200:
        with open(EXCEL_PATH, "wb") as f:
            f.write(response.content)
        print("[SYNC] Excel downloaded.")
    else:
        print("[ERROR] Failed to download Excel.")

def extract_drive_id(url):
    if "id=" in url:
        return url.split("id=")[-1].split("&")[0]
    elif "/d/" in url:
        return url.split("/d/")[1].split("/")[0]
    return None

def download_image(file_id, save_path):
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    response = requests.get(url)

    content_type = response.headers.get("Content-Type", "")
    if response.status_code == 200 and "image" in content_type:
        with open(save_path, "wb") as f:
            f.write(response.content)
        print(f"[IMG] Saved: {save_path}")
    else:
        print(f"[ERROR] File is not an image or not accessible: {file_id} ({content_type})")


def sync_known_faces():
    if not os.path.exists(KNOWN_DIR):
        os.makedirs(KNOWN_DIR)

    download_latest_excel()
    df = pd.read_excel(EXCEL_PATH)

    for _, row in df.iterrows():
        try:
            raw_name = str(row["Photo (name it as ID_Firstname Surname)"]).strip()
            name = str(row["Name"]).strip()
            student_id = str(row["Id"]).strip()
            file_id = extract_drive_id(raw_name)
            
            if not file_id:
                print(f"[WARN] Could not extract file ID from: {raw_name}")
                continue

            filename = f"{student_id}_{name.replace(' ', '_')}.jpg"
            save_path = os.path.join(KNOWN_DIR, filename)

            if not os.path.exists(save_path):
                download_image(file_id, save_path)
        except Exception as e:
            print(f"[WARN] Failed to sync image: {e}")


if __name__ == "__main__":
    sync_known_faces()
