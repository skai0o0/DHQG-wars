import os
import sys
import json
import time
import random
import argparse
import urllib.request
import urllib.parse

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from PIL import Image, ImageFilter
import numpy as np
import scipy.ndimage

COMFY_URL = "http://127.0.0.1:8188"
WORKFLOW_TEMPLATE = os.path.join(os.path.dirname(__file__), "..", "game-assets-workflow.json")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "generated")

os.makedirs(OUTPUT_DIR, exist_ok=True)

LANDMARKS_CONFIG = [
    {
        "id": 1,
        "name": "landmark_1",
        "title": "Nhà Văn Hóa Sinh Viên (Con Thuyền)",
        "prompt": (
            "Isometric 2.5D architectural game asset of monumental hexagonal youth cultural pavilion shaped like a futuristic ship prow, "
            "stepped concrete terraces, cyan glass atrium dome, rooftop antenna beacon, command and conquer sci-fi rts style, "
            "cyber university architecture, isolated on pure white background, no white border, no sticker contour, clean sharp edges, "
            "crisp details, ambient occlusion, dvr-pixel-flux"
        ),
        "size": (480, 420)
    },
    {
        "id": 2,
        "name": "landmark_2",
        "title": "Khu Quân Sự (GDQP-AN)",
        "prompt": (
            "Isometric 2.5D military fortress base game asset, fortified concrete command bunker, camouflage watchtower with searchlight, "
            "rotating radar dish antenna, sandbag barricades, command and conquer sci-fi rts style, cyber military architecture, "
            "isolated on pure white background, no white border, no sticker contour, clean sharp edges, crisp details, ambient occlusion, dvr-pixel-flux"
        ),
        "size": (480, 420)
    },
    {
        "id": 3,
        "name": "landmark_3",
        "title": "Thư Viện Trung Tâm ĐHQG",
        "prompt": (
            "Isometric 2.5D architectural game asset of monumental futuristic central university library, stepped pyramid architectural tiers, "
            "glowing cyan glass dome, digital knowledge beacon, cyber campus library, command and conquer sci-fi rts style, "
            "isolated on pure white background, no white border, no sticker contour, clean sharp edges, crisp details, ambient occlusion, dvr-pixel-flux"
        ),
        "size": (480, 420)
    },
    {
        "id": 4,
        "name": "landmark_4",
        "title": "Chợ Đêm Làng Đại Học",
        "prompt": (
            "Isometric 2.5D game asset of lively student night market bazaar, colorful striped festival canopies, street food stalls, "
            "neon signboards, glowing lanterns, campus plaza, command and conquer sci-fi rts style, "
            "isolated on pure white background, no white border, no sticker contour, clean sharp edges, crisp details, ambient occlusion, dvr-pixel-flux"
        ),
        "size": (480, 420)
    },
    {
        "id": 5,
        "name": "landmark_5",
        "title": "Cụm Hồ Đá & Hồ Thủy Xạ",
        "prompt": (
            "Isometric 2.5D natural landscape game asset of sheer jagged sandstone rock quarry cliffs surrounding deep emerald turquoise quarry lake, "
            "rocky boulders, natural stone landmark, command and conquer sci-fi rts style, "
            "isolated on pure white background, no white border, no sticker contour, clean sharp edges, crisp details, ambient occlusion, dvr-pixel-flux"
        ),
        "size": (480, 420)
    },
    {
        "id": 6,
        "name": "landmark_6",
        "title": "Dốc Tình (Dốc Nghĩa Tình)",
        "prompt": (
            "Isometric 2.5D scenic game asset of winding hillside road ascending lush pine hill, cyber street lamp posts, "
            "scenic observation overlook pavilion, romantic campus forest road, command and conquer sci-fi rts style, "
            "isolated on pure white background, no white border, no sticker contour, clean sharp edges, crisp details, ambient occlusion, dvr-pixel-flux"
        ),
        "size": (480, 420)
    },
    {
        "id": 7,
        "name": "landmark_7",
        "title": "Ký Túc Xá Khu A & B",
        "prompt": (
            "Isometric 2.5D game asset of futuristic modular university student dormitory apartment complex, interconnected high-rise residential towers, "
            "skybridge, colorful balconies, solar panel array, command and conquer sci-fi rts style, "
            "isolated on pure white background, no white border, no sticker contour, clean sharp edges, crisp details, ambient occlusion, dvr-pixel-flux"
        ),
        "size": (480, 420)
    },
    {
        "id": 8,
        "name": "landmark_8",
        "title": "Ngã Ba 621",
        "prompt": (
            "Isometric 2.5D game asset of strategic highway road checkpoint junction, illuminated digital highway road signs gantry, "
            "barrier gates, security control outpost, road barricades, command and conquer sci-fi rts style, "
            "isolated on pure white background, no white border, no sticker contour, clean sharp edges, crisp details, ambient occlusion, dvr-pixel-flux"
        ),
        "size": (480, 420)
    },
    {
        "id": 9,
        "name": "landmark_9",
        "title": "Cánh Đồng Cỏ Lau",
        "prompt": (
            "Isometric 2.5D environmental game asset of idyllic rolling green meadow, rustic observation windmill tower with brown timber wooden roof, "
            "wooden boardwalk pathway, golden green reed grass, command and conquer sci-fi rts style, "
            "isolated on pure white background, no white border, no sticker contour, clean sharp edges, crisp details, ambient occlusion, dvr-pixel-flux"
        ),
        "size": (480, 420)
    },
    {
        "id": 10,
        "name": "landmark_10",
        "title": "Tòa Nhà Điều Hành ĐHQG",
        "prompt": (
            "Isometric 2.5D architectural game asset of monumental university administration headquarters skyscraper, glass pyramid crown apex, "
            "ceremonial entrance courtyard with grand fountains, cyber government citadel, command and conquer sci-fi rts style, "
            "isolated on pure white background, no white border, no sticker contour, clean sharp edges, crisp details, ambient occlusion, dvr-pixel-flux"
        ),
        "size": (480, 420)
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
    """
    Precision background removal:
    - Finds exterior pure white background connected to borders.
    - Preserves interior whites.
    - Feathers edges with 1px smooth alpha.
    """
    img = pil_img.convert("RGBA")
    arr = np.array(img).astype(np.float32)
    rgb = arr[:, :, :3]

    # Sample corners
    corners = [rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]]
    bg_color = np.median(corners, axis=0)

    diff = np.max(np.abs(rgb - bg_color), axis=2)
    bg_candidate = diff < 38.0
    labeled, _ = scipy.ndimage.label(bg_candidate)

    # Labels touching image boundaries
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

def generate_single_landmark(item):
    name = item["name"]
    prompt = item["prompt"]
    size = item["size"]
    title = item["title"]

    with open(WORKFLOW_TEMPLATE, "r", encoding="utf-8") as f:
        wf = json.load(f)

    wf["6"]["inputs"]["text"] = prompt
    seed = random.randint(1000000000000, 9999999999999)
    wf["25"]["inputs"]["noise_seed"] = seed

    print(f"\n==================================================")
    print(f"[*] Processing Landmark #{item['id']}: {title} ({name})")
    print(f"[*] Seed: {seed}")
    print(f"==================================================")

    res = queue_prompt(wf)
    prompt_id = res.get("prompt_id")
    if not prompt_id:
        raise ValueError(f"Failed to get prompt_id: {res}")

    t0 = time.time()
    filename, subfolder, img_type = wait_for_prompt(prompt_id)
    duration = time.time() - t0
    print(f"[+] Generation completed in {duration:.1f}s -> {filename}")

    raw_bytes = download_image(filename, subfolder, img_type)
    
    import io
    pil_raw = Image.open(io.BytesIO(raw_bytes))
    transparent = clean_white_background(pil_raw)
    transparent.thumbnail(size, Image.Resampling.LANCZOS)

    out_file = os.path.join(OUTPUT_DIR, f"{name}.png")
    transparent.save(out_file, "PNG", optimize=True)
    print(f"[+] Saved transparent asset -> {out_file} (Resolution: {transparent.size})\n")
    return out_file

def main():
    parser = argparse.ArgumentParser(description="Generate RTS Game Assets via ComfyUI")
    parser.add_argument("--id", type=int, default=None, help="Generate a specific landmark by ID (1-10)")
    parser.add_argument("--all", action="store_true", help="Generate all 10 landmarks")
    parser.add_argument("--missing", action="store_true", help="Generate only missing landmarks")
    args = parser.parse_args()

    if args.id is not None:
        target = next((item for item in LANDMARKS_CONFIG if item["id"] == args.id), None)
        if not target:
            print(f"Error: Landmark ID {args.id} not found.")
            sys.exit(1)
        generate_single_landmark(target)
    elif args.all or args.missing:
        targets = LANDMARKS_CONFIG
        if args.missing:
            targets = [item for item in LANDMARKS_CONFIG if not os.path.exists(os.path.join(OUTPUT_DIR, f"{item['name']}.png"))]
            print(f"Found {len(targets)} missing landmarks to generate.")

        print(f"Starting batch generation of {len(targets)} landmarks via ComfyUI API...")
        t_start = time.time()
        for idx, item in enumerate(targets, 1):
            print(f"\n>>> PROGRESS: {idx}/{len(targets)} <<<")
            generate_single_landmark(item)
        total_time = time.time() - t_start
        print(f"\n[SUCCESS] All {len(targets)} landmarks generated in {total_time:.1f}s!")
    else:
        print("Usage: python generate_comfy_assets.py --all  (or --id <1-10> or --missing)")

if __name__ == "__main__":
    main()
