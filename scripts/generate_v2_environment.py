import os
import sys
import json
import time
import random
import urllib.request
import urllib.parse

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
import scipy.ndimage

COMFY_URL = "http://127.0.0.1:8188"
WORKFLOW_TEMPLATE = os.path.join(os.path.dirname(__file__), "..", "game-assets-workflow.json")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "generated")

os.makedirs(OUTPUT_DIR, exist_ok=True)

ASSETS_TO_GENERATE = [
    {
        "name": "terrain_campus",
        "title": "Mặt Đất Sa Bàn Làng Đại Học (Sáng & Rõ Nét)",
        "is_tileable": True,
        "prompt": (
            "Seamless tileable texture of vibrant military RTS campus terrain, aerial top-down view, "
            "bright olive green lawn grass, sunny beige stone walkways, light concrete university campus pathways, "
            "satellite tactical map texture, clear daytime sunlight, high contrast, crisp details, "
            "Command and Conquer Tiberian Sun and Red Alert 2 RTS terrain style, 8k, rts game texture, dvr-pixel-flux"
        ),
        "size": (512, 512),
        "brightness": 1.12,
        "contrast": 1.15
    },
    {
        "name": "terrain_foundation",
        "title": "Bệ Móng Bê Tông Quân Sự Rộng Rãi (Wide Foundation Deck)",
        "is_tileable": False,
        "prompt": (
            "Isometric 2.5D game asset of wide low-profile hexagonal military concrete platform deck, "
            "flat spacious top base surface, beveled sloped armor edges, yellow and black caution hazard stripes, "
            "recessed glowing cyan energy conduit lines, heavy industrial sci-fi foundation dais, "
            "isolated on pure white background, no white border, no sticker contour, clean sharp edges, dvr-pixel-flux"
        ),
        "size": (512, 384)
    },
    {
        "name": "terrain_road",
        "title": "Đường Trục Quân Sự & Năng Lượng (Tactical Road)",
        "is_tileable": True,
        "prompt": (
            "Seamless tileable texture of straight sci-fi military tactical asphalt road, "
            "two-lane dark gray asphalt roadway with luminous glowing cyan dividing lane markings, "
            "reinforced concrete curbs, top-down straight aerial view, clean RTS game texture, dvr-pixel-flux"
        ),
        "size": (256, 256),
        "brightness": 1.05,
        "contrast": 1.10
    },
    {
        "name": "landmark_9",
        "title": "Cánh Đồng Cỏ Lau (Windmill không có khối cỏ vuông)",
        "is_tileable": False,
        "prompt": (
            "Isometric 2.5D game asset of rustic wooden windmill observatory tower, detailed timber scaffolding, "
            "canvas windmill blades, surrounded by clusters of tall white fluffy reed pampas grass and small cobblestones at base, "
            "isolated on pure white background, no green ground diamond, no flat base plane, clean sharp edges, dvr-pixel-flux"
        ),
        "size": (480, 480)
    }
]

def queue_prompt(prompt_workflow):
    p = {"prompt": prompt_workflow}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(f"{COMFY_URL}/prompt", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def wait_for_prompt(prompt_id, timeout=120):
    start_time = time.time()
    while time.time() - start_time < timeout:
        req = urllib.request.Request(f"{COMFY_URL}/history/{prompt_id}")
        with urllib.request.urlopen(req) as resp:
            history = json.loads(resp.read().decode('utf-8'))
        if prompt_id in history:
            outputs = history[prompt_id].get("outputs", {})
            for node_id, node_output in outputs.items():
                if "images" in node_output and len(node_output["images"]) > 0:
                    img_info = node_output["images"][0]
                    return img_info["filename"], img_info.get("subfolder", ""), img_info.get("type", "output")
        time.sleep(1.0)
    raise TimeoutError(f"Generation timed out after {timeout} seconds")

def download_image(filename, subfolder, img_type):
    params = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": img_type})
    url = f"{COMFY_URL}/view?{params}"
    with urllib.request.urlopen(url) as resp:
        return resp.read()

def clean_white_background(pil_img):
    img = pil_img.convert("RGBA")
    arr = np.array(img).astype(np.float32)
    rgb = arr[:, :, :3]

    corners = [rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]]
    bg_color = np.median(corners, axis=0)

    diff = np.max(np.abs(rgb - bg_color), axis=2)
    bg_candidate = diff < 38.0
    labeled, _ = scipy.ndimage.label(bg_candidate)

    edge_labels = set(labeled[0, :]).union(labeled[-1, :]).union(labeled[:, 0]).union(labeled[:, -1]) - {0}
    is_bg = np.isin(labeled, list(edge_labels))

    alpha = np.where(is_bg, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode='L').filter(ImageFilter.GaussianBlur(1.0))
    img.putalpha(alpha_img)

    bbox = img.getbbox()
    if bbox:
        w, h = img.size
        bx1 = max(0, bbox[0] - 6)
        by1 = max(0, bbox[1] - 6)
        bx2 = min(w, bbox[2] + 6)
        by2 = min(h, bbox[3] + 6)
        img = img.crop((bx1, by1, bx2, by2))

    return img

def soft_feather_bottom(img):
    """
    Feather the bottom 15% edges so the base smoothly fades out into the ground.
    """
    arr = np.array(img).astype(np.float32)
    h, w = arr.shape[:2]
    alpha = arr[:, :, 3]

    # Create smooth vertical fade for bottom 15%
    bottom_start = int(h * 0.82)
    for y in range(bottom_start, h):
        factor = 1.0 - ((y - bottom_start) / (h - bottom_start)) ** 1.5
        alpha[y, :] *= factor

    arr[:, :, 3] = np.clip(alpha, 0, 255)
    return Image.fromarray(arr.astype(np.uint8))

def main():
    print(f"=== KHỞI CHẠY SINH ASSET MÔI TRƯỜNG V2 QUA COMFYUI ===")
    t_start = time.time()

    with open(WORKFLOW_TEMPLATE, "r", encoding="utf-8") as f:
        wf = json.load(f)

    for idx, item in enumerate(ASSETS_TO_GENERATE, 1):
        name = item["name"]
        prompt = item["prompt"]
        size = item["size"]
        title = item["title"]

        wf["6"]["inputs"]["text"] = prompt
        seed = random.randint(1000000000000, 9999999999999)
        wf["25"]["inputs"]["noise_seed"] = seed

        print(f"\n[{idx}/{len(ASSETS_TO_GENERATE)}] Đang sinh asset: {title} ({name})...")
        res = queue_prompt(wf)
        pid = res["prompt_id"]

        t0 = time.time()
        filename, subfolder, img_type = wait_for_prompt(pid)
        print(f"[+] Hoàn thành sinh sau {time.time()-t0:.1f}s -> {filename}")

        raw_bytes = download_image(filename, subfolder, img_type)
        import io
        pil_raw = Image.open(io.BytesIO(raw_bytes))

        if item["is_tileable"]:
            final_img = pil_raw.convert("RGB").resize(size, Image.Resampling.LANCZOS)
            if "brightness" in item:
                final_img = ImageEnhance.Brightness(final_img).enhance(item["brightness"])
            if "contrast" in item:
                final_img = ImageEnhance.Contrast(final_img).enhance(item["contrast"])
        else:
            final_img = clean_white_background(pil_raw)
            final_img.thumbnail(size, Image.Resampling.LANCZOS)
            final_img = soft_feather_bottom(final_img)

        out_path = os.path.join(OUTPUT_DIR, f"{name}.png")
        final_img.save(out_path, "PNG", optimize=True)
        print(f"[+] Đã lưu thành công -> {out_path} ({final_img.size})")

    print(f"\n[HOÀN TẤT] Sinh xong {len(ASSETS_TO_GENERATE)} asset trong {time.time()-t_start:.1f}s!")

if __name__ == "__main__":
    main()
