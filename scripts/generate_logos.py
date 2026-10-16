import os
import subprocess

def generate_all_brand_assets():
    os.makedirs("public", exist_ok=True)
    os.makedirs("dist", exist_ok=True)

    # 1. OFFICIAL EMBLEM (512x512) - Exact match to user image.png:
    # - Warm ivory rounded container (#FAF8F5 with #E8D7C9 border)
    # - Solid black upward accomplishment arrow (#1D1D1B)
    # - Terracotta orange central flame/bulb (#C96F55)
    # - Soft sand open book pages (#DEBAA2)
    # - Black foundation spine arc (#1D1D1B)
    # - 5 Sunburst rays: top terracotta, diagonal sand, outer black
    official_emblem_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <!-- Minimalist warm ivory rounded container matching user logo -->
  <rect x="16" y="16" width="480" height="480" rx="104" fill="#FAF8F5" stroke="#E8D7C9" stroke-width="4" />

  <g id="engez-brand-mark" transform="translate(0, 10)">
    <!-- 1. Radiating Sunburst Rays -->
    <!-- Top Center Ray (Terracotta Orange #C96F55) -->
    <line x1="256" y1="88" x2="256" y2="124" stroke="#C96F55" stroke-width="12" stroke-linecap="round" />
    
    <!-- Top-Left Diagonal Ray (Warm Sand #DEBAA2) -->
    <line x1="204" y1="116" x2="224" y2="134" stroke="#DEBAA2" stroke-width="11" stroke-linecap="round" />
    
    <!-- Top-Right Diagonal Ray (Warm Sand #DEBAA2) -->
    <line x1="308" y1="116" x2="288" y2="134" stroke="#DEBAA2" stroke-width="11" stroke-linecap="round" />
    
    <!-- Far-Left Horizontal Ray (Charcoal Black #1D1D1B) -->
    <line x1="182" y1="156" x2="204" y2="160" stroke="#1D1D1B" stroke-width="11" stroke-linecap="round" />
    
    <!-- Far-Right Horizontal Ray (Charcoal Black #1D1D1B) -->
    <line x1="330" y1="156" x2="308" y2="160" stroke="#1D1D1B" stroke-width="11" stroke-linecap="round" />

    <!-- 2. Dynamic Upward Accomplishment Arrow (SOLID BLACK #1D1D1B matching user logo) -->
    <path 
      d="M 256 142 
         L 286 182 
         L 266 182 
         L 266 210 
         L 246 210 
         L 246 182 
         L 226 182 
         Z" 
      fill="#1D1D1B" 
      stroke="#1D1D1B" 
      stroke-width="2" 
      stroke-linejoin="round" 
    />

    <!-- 3. Central Flame / Bulb of Mastery (Terracotta Orange #C96F55) -->
    <path 
      d="M 246 208 
         C 246 226, 204 246, 200 278 
         C 196 308, 230 334, 256 348 
         C 282 334, 316 308, 312 278 
         C 308 246, 266 226, 266 208 
         Z" 
      fill="#C96F55" 
    />

    <!-- 4. Open Book Pages (Warm Sand #DEBAA2) -->
    <!-- Left Page Wing -->
    <path 
      d="M 112 328 
         C 152 326, 196 338, 236 352 
         C 236 358, 230 364, 222 366 
         C 180 364, 138 354, 106 342 
         C 107 334, 109 330, 112 328 
         Z" 
      fill="#DEBAA2" 
      stroke="#CCA389" 
      stroke-width="1.5" 
    />

    <!-- Right Page Wing -->
    <path 
      d="M 400 328 
         C 360 326, 316 338, 276 352 
         C 276 358, 282 364, 290 366 
         C 332 364, 374 354, 406 342 
         C 405 334, 403 330, 400 328 
         Z" 
      fill="#DEBAA2" 
      stroke="#CCA389" 
      stroke-width="1.5" 
    />

    <!-- 5. Minimalist Foundation Line / Book Base (Charcoal Obsidian #1D1D1B) -->
    <path 
      d="M 96 350 
         C 142 376, 202 378, 256 360 
         C 310 378, 370 376, 416 350" 
      fill="none" 
      stroke="#1D1D1B" 
      stroke-width="16" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
    />
  </g>
</svg>"""

    # Unify light and dark theme emblem so dark theme has the EXACT same official logo
    light_emblem_svg = official_emblem_svg
    dark_emblem_svg = official_emblem_svg

    # 3. HORIZONTAL LIGHT LOGO (920x320)
    horizontal_light_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 320" width="920" height="320" fill="none">
  <rect width="920" height="320" rx="36" fill="#FAF8F5" stroke="#E8D7C9" stroke-width="2" />

  <!-- EMBLEM SCALED ON LEFT -->
  <g transform="translate(24, 0) scale(0.62)">
    <line x1="256" y1="88" x2="256" y2="124" stroke="#C96F55" stroke-width="12" stroke-linecap="round" />
    <line x1="204" y1="116" x2="224" y2="134" stroke="#DEBAA2" stroke-width="11" stroke-linecap="round" />
    <line x1="308" y1="116" x2="288" y2="134" stroke="#DEBAA2" stroke-width="11" stroke-linecap="round" />
    <line x1="182" y1="156" x2="204" y2="160" stroke="#1D1D1B" stroke-width="11" stroke-linecap="round" />
    <line x1="330" y1="156" x2="308" y2="160" stroke="#1D1D1B" stroke-width="11" stroke-linecap="round" />

    <path d="M 256 142 L 286 182 L 266 182 L 266 210 L 246 210 L 246 182 L 226 182 Z" fill="#1D1D1B" stroke="#1D1D1B" stroke-width="2" stroke-linejoin="round" />

    <path d="M 246 208 C 246 226, 204 246, 200 278 C 196 308, 230 334, 256 348 C 282 334, 316 308, 312 278 C 308 246, 266 226, 266 208 Z" fill="#C96F55" />

    <path d="M 112 328 C 152 326, 196 338, 236 352 C 236 358, 230 364, 222 366 C 180 364, 138 354, 106 342 C 107 334, 109 330, 112 328 Z" fill="#DEBAA2" stroke="#CCA389" stroke-width="1.5" />
    <path d="M 400 328 C 360 326, 316 338, 276 352 C 276 358, 282 364, 290 366 C 332 364, 374 354, 406 342 C 405 334, 403 330, 400 328 Z" fill="#DEBAA2" stroke="#CCA389" stroke-width="1.5" />

    <path d="M 96 350 C 142 376, 202 378, 256 360 C 310 378, 370 376, 416 350" fill="none" stroke="#1D1D1B" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- TYPOGRAPHY ON RIGHT -->
  <g transform="translate(360, 0)">
    <text x="0" y="152" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Plus Jakarta Sans', sans-serif" 
          font-size="72" 
          font-weight="800" 
          letter-spacing="-1.5" 
          fill="#1D1D1B">Engez Nafsak</text>

    <text x="2" y="224" 
          font-family="'Noto Sans Arabic', 'Cairo', 'Almarai', 'Segoe UI', Tahoma, sans-serif" 
          font-size="48" 
          font-weight="700" 
          letter-spacing="0.5" 
          fill="#C96F55">إنجز نفسك</text>
  </g>
</svg>"""

    # 4. HORIZONTAL DARK LOGO (920x320) - Official emblem embedded
    horizontal_dark_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 320" width="920" height="320" fill="none">
  <rect width="920" height="320" rx="36" fill="#141210" stroke="#FAF8F5" stroke-opacity="0.15" stroke-width="2" />

  <g transform="translate(24, 0) scale(0.62)">
    <line x1="256" y1="88" x2="256" y2="124" stroke="#C96F55" stroke-width="12" stroke-linecap="round" />
    <line x1="204" y1="116" x2="224" y2="134" stroke="#DEBAA2" stroke-width="11" stroke-linecap="round" />
    <line x1="308" y1="116" x2="288" y2="134" stroke="#DEBAA2" stroke-width="11" stroke-linecap="round" />
    <line x1="182" y1="156" x2="204" y2="160" stroke="#FAF8F5" stroke-width="11" stroke-linecap="round" />
    <line x1="330" y1="156" x2="308" y2="160" stroke="#FAF8F5" stroke-width="11" stroke-linecap="round" />

    <path d="M 256 142 L 286 182 L 266 182 L 266 210 L 246 210 L 246 182 L 226 182 Z" fill="#FAF8F5" stroke="#FAF8F5" stroke-width="2" stroke-linejoin="round" />

    <path d="M 246 208 C 246 226, 204 246, 200 278 C 196 308, 230 334, 256 348 C 282 334, 316 308, 312 278 C 308 246, 266 226, 266 208 Z" fill="#C96F55" />

    <path d="M 112 328 C 152 326, 196 338, 236 352 C 236 358, 230 364, 222 366 C 180 364, 138 354, 106 342 C 107 334, 109 330, 112 328 Z" fill="#DEBAA2" stroke="#CCA389" stroke-width="1.5" />
    <path d="M 400 328 C 360 326, 316 338, 276 352 C 276 358, 282 364, 290 366 C 332 364, 374 354, 406 342 C 405 334, 403 330, 400 328 Z" fill="#DEBAA2" stroke="#CCA389" stroke-width="1.5" />

    <path d="M 96 350 C 142 376, 202 378, 256 360 C 310 378, 370 376, 416 350" fill="none" stroke="#FAF8F5" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <g transform="translate(360, 0)">
    <text x="0" y="152" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Plus Jakarta Sans', sans-serif" 
          font-size="72" 
          font-weight="800" 
          letter-spacing="-1.5" 
          fill="#FAF8F5">Engez Nafsak</text>

    <text x="2" y="224" 
          font-family="'Noto Sans Arabic', 'Cairo', 'Almarai', 'Segoe UI', Tahoma, sans-serif" 
          font-size="48" 
          font-weight="700" 
          letter-spacing="0.5" 
          fill="#C96F55">إنجز نفسك</text>
  </g>
</svg>"""

    # File mapping
    file_map = {
        "public/engez_brand_emblem.svg": light_emblem_svg,
        "public/engez_brand_emblem_dark.svg": dark_emblem_svg,
        "public/engez_brand_logo.svg": horizontal_light_svg,
        "public/engez_brand_logo_dark.svg": horizontal_dark_svg,
        "public/logo.svg": light_emblem_svg,
        "public/minimal_logo.svg": light_emblem_svg,
        "public/favicon.svg": light_emblem_svg,
        "public/favicon_dark.svg": dark_emblem_svg,
        "dist/engez_brand_emblem.svg": light_emblem_svg,
        "dist/engez_brand_emblem_dark.svg": dark_emblem_svg,
        "dist/engez_brand_logo.svg": horizontal_light_svg,
        "dist/engez_brand_logo_dark.svg": horizontal_dark_svg,
        "dist/logo.svg": light_emblem_svg,
        "dist/minimal_logo.svg": light_emblem_svg,
    }

    for path, content in file_map.items():
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {path}")

    # Generate matching PNGs using Ghostscript
    ps_content = """%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 512 512
%%Pages: 1
%%LanguageLevel: 3
%%EndComments

%%Page: 1 1
gsave

/roundrect { % x y w h r
  /r exch def
  /h exch def
  /w exch def
  /y exch def
  /x exch def
  newpath
  x r add y moveto
  x w add y x w add y h add r arcto 4 {pop} repeat
  x w add y h add x y h add r arcto 4 {pop} repeat
  x y h add x y r arcto 4 {pop} repeat
  x y x w add y r arcto 4 {pop} repeat
  closepath
} def

% Warm ivory background matching user image
0.98 0.972 0.96 setrgbcolor
0 0 512 512 72 roundrect fill

% Border
0.91 0.843 0.788 setrgbcolor
2 setlinewidth
2 2 508 508 70 roundrect stroke

% Central scale & translate
256 256 translate
0.95 0.95 scale
-256 -256 translate

% 1. SUNBURST RAYS
% Top Center Ray (Terracotta: #C96F55)
0.788 0.435 0.333 setrgbcolor
250 388 12 38 6 roundrect fill

% Top Left Ray (Soft Sand/Peach: #DFC0A9)
gsave
0.875 0.753 0.663 setrgbcolor
207 385 translate
38 rotate
-6 -15 11 30 5.5 roundrect fill
grestore

% Top Right Ray
gsave
0.875 0.753 0.663 setrgbcolor
304 385 translate
-38 rotate
-6 -15 11 30 5.5 roundrect fill
grestore

% Lower Left Ray (Black: #1D1D1B)
gsave
0.114 0.114 0.106 setrgbcolor
185 349 translate
75 rotate
-5 -11 10 22 5 roundrect fill
grestore

% Lower Right Ray (Black)
gsave
0.114 0.114 0.106 setrgbcolor
327 349 translate
-75 rotate
-5 -11 10 22 5 roundrect fill
grestore

% 2. UPWARD ARROW (SOLID BLACK #1D1D1B matching user logo)
0.114 0.114 0.106 setrgbcolor
newpath
256 370 moveto
284 328 lineto
264 328 lineto
264 300 lineto
248 300 lineto
248 328 lineto
228 328 lineto
closepath
fill

% 3. OPEN BOOK WINGS (Soft Sand/Peach)
0.875 0.753 0.663 setrgbcolor
% Left Page Wing
newpath
112 212 moveto
152 214 196 200 236 180 curveto
236 174 232 168 226 166 curveto
182 168 140 178 105 194 curveto
106 204 108 210 112 212 curveto
closepath
fill

% Right Page Wing
newpath
400 212 moveto
360 214 316 200 276 180 curveto
276 174 280 168 286 166 curveto
330 168 372 178 407 194 curveto
406 204 404 210 400 212 curveto
closepath
fill

% 4. OPEN BOOK BOTTOM SPINE (Black stroke)
0.114 0.114 0.106 setrgbcolor
16 setlinewidth
1 setlinecap
1 setlinejoin
newpath
96 186 moveto
142 160 202 158 256 176 curveto
310 158 370 160 416 186 curveto
stroke

% 5. WINDING ROAD / FLAME (Terracotta)
0.788 0.435 0.333 setrgbcolor
newpath
248 302 moveto
248 286 206 270 202 240 curveto
198 212 230 190 256 176 curveto
288 182 336 198 344 220 curveto
348 246 268 276 264 302 curveto
closepath
fill

grestore
showpage
%%EOF
"""
    with open("/tmp/brand_logo_all_orange.ps", "w") as f:
        f.write(ps_content)

    png_targets = [
        "public/logo.png",
        "public/vector_logo.png",
        "public/minimal_logo.png",
        "dist/logo.png",
        "dist/vector_logo.png",
        "dist/minimal_logo.png",
    ]

    for target in png_targets:
        cmd = ["gs", "-sDEVICE=pngalpha", "-r144", f"-o{target}", "/tmp/brand_logo_all_orange.ps"]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"Generated {target}")

if __name__ == "__main__":
    generate_all_brand_assets()
