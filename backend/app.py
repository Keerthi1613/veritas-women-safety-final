from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
import io

# Optional: Set Tesseract path for Windows
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = Flask(__name__)
CORS(app)

def extract_ocr_data(image):
    text = pytesseract.image_to_string(image)
    lines = text.split("\n")
    lines = [line.strip() for line in lines if line.strip()]
    return lines

def analyze_profile(data):
    explanation = []
    likely_fake = False

    # 1. Followers check
    followers = int(data.get("followers", "0") or "0")
    if followers == 0:
        likely_fake = True
        explanation.append("Follower count is 0 — very likely fake.")
    elif followers < 20:
        likely_fake = True
        explanation.append(f"Only {followers} followers — suspiciously low.")

    # 2. Following to followers ratio
    following = int(data.get("following", "0") or "0")
    if following > followers * 3 and followers != 0:
        explanation.append("High following-to-followers ratio — may indicate fake activity.")

    # 3. Posts check
    posts = int(data.get("posts", "0") or "0")
    if posts == 0:
        explanation.append("No posts — could be a fake or abandoned account.")
    elif posts <= 2:
        explanation.append("Very few posts — suspicious activity.")

    # 4. Same-day posting
    if data.get("posted_same_day") == "true":
        explanation.append("All posts were made on the same day — commonly seen in fake accounts.")
        likely_fake = True

    # 5. Empty bio
    bio = data.get("bio", "").strip()
    if not bio:
        explanation.append("Empty bio — not necessarily fake, but adds to suspicion.")

    # 6. Username pattern
    username = data.get("username", "").lower()
    if any(c in username for c in ['_', '.', '123', 'official']) or len(username) > 15:
        explanation.append("Username contains suspicious patterns (e.g., numbers, underscores).")

    # Default reasoning
    if not explanation:
        explanation.append("No clear signs of fakeness found based on inputs.")

    return {
        "result": "Likely Fake" if likely_fake else "Real",
        "explanation": explanation
    }

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        image = request.files.get("image")
        data = request.form.to_dict()

        if image:
            img_bytes = image.read()
            pil_image = Image.open(io.BytesIO(img_bytes))
            ocr_lines = extract_ocr_data(pil_image)

            # Simple OCR-based extraction if input fields are empty
            for line in ocr_lines:
                if "followers" in line.lower() and not data.get("followers"):
                    parts = line.lower().split()
                    for part in parts:
                        if "k" in part:
                            data["followers"] = str(int(float(part.replace("k", "")) * 1000))
                        elif part.isdigit():
                            data["followers"] = part
                if "following" in line.lower() and not data.get("following"):
                    parts = line.lower().split()
                    for part in parts:
                        if part.isdigit():
                            data["following"] = part
                if "posts" in line.lower() and not data.get("posts"):
                    parts = line.lower().split()
                    for part in parts:
                        if part.isdigit():
                            data["posts"] = part

        result = analyze_profile(data)
        return jsonify(result)

    except Exception as e:
        print("Exception:", str(e))
        return jsonify({"error": "Internal server error."}), 500

if __name__ == "__main__":
    app.run(debug=True)
