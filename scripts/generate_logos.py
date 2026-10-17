import os
import subprocess

def generate_all_brand_assets():
    os.makedirs("public", exist_ok=True)
    os.makedirs("dist", exist_ok=True)

    # 1. OFFICIAL LIGHT EMBLEM (512x512)
    official_light_emblem_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
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

    # 2. OFFICIAL DARK EMBLEM (512x512) - Tailored to website obsidian & neon violet dark theme
    official_dark_emblem_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="engez-dark-flame" x1="256" y1="208" x2="256" y2="348" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#C084FC" />
      <stop offset="50%" stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#6D28D9" />
    </linearGradient>
    <linearGradient id="engez-dark-border" x1="16" y1="16" x2="496" y2="496" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.55" />
      <stop offset="50%" stop-color="#A855F7" stop-opacity="0.30" />
      <stop offset="100%" stop-color="#6D28D9" stop-opacity="0.50" />
    </linearGradient>
    <radialGradient id="engez-dark-glow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#140E26" />
      <stop offset="65%" stop-color="#0A0714" />
      <stop offset="100%" stop-color="#05030A" />
    </radialGradient>
  </defs>

  <!-- Deep Obsidian & Violet surface container matching website dark theme -->
  <rect x="16" y="16" width="480" height="480" rx="104" fill="url(#engez-dark-glow)" stroke="url(#engez-dark-border)" stroke-width="4" />

  <g id="engez-brand-mark" transform="translate(0, 10)">
    <!-- 1. Radiating Sunburst Rays -->
    <!-- Top Center Ray: Neon Violet / Purple (#A855F7) -->
    <line x1="256" y1="88" x2="256" y2="124" stroke="#A855F7" stroke-width="12" stroke-linecap="round" />
    
    <!-- Top-Left Diagonal Ray: Soft Lavender (#C4B5FD) -->
    <line x1="204" y1="116" x2="224" y2="134" stroke="#C4B5FD" stroke-width="11" stroke-linecap="round" />
    
    <!-- Top-Right Diagonal Ray: Soft Lavender (#C4B5FD) -->
    <line x1="308" y1="116" x2="288" y2="134" stroke="#C4B5FD" stroke-width="11" stroke-linecap="round" />
    
    <!-- Far-Left Horizontal Ray: Crisp Pure White (#FFFFFF) -->
    <line x1="182" y1="156" x2="204" y2="160" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" />
    
    <!-- Far-Right Horizontal Ray: Crisp Pure White (#FFFFFF) -->
    <line x1="330" y1="156" x2="308" y2="160" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" />

    <!-- 2. Dynamic Upward Accomplishment Arrow: Crisp Pure White (#FFFFFF) -->
    <path 
      d="M 256 142 
         L 286 182 
         L 266 182 
         L 266 210 
         L 246 210 
         L 246 182 
         L 226 182 
         Z" 
      fill="#FFFFFF" 
      stroke="#FFFFFF" 
      stroke-width="2" 
      stroke-linejoin="round" 
    />

    <!-- 3. Central Flame / Bulb of Mastery: Neon Violet Gradient (#8B5CF6 -> #6D28D9) -->
    <path 
      d="M 246 208 
         C 246 226, 204 246, 200 278 
         C 196 308, 230 334, 256 348 
         C 282 334, 316 308, 312 278 
         C 308 246, 266 226, 266 208 
         Z" 
      fill="url(#engez-dark-flame)" 
      stroke="#A855F7"
      stroke-width="1.5"
    />

    <!-- 4. Open Book Pages: Luminous Lavender Wings (#C4B5FD) -->
    <!-- Left Page Wing -->
    <path 
      d="M 112 328 
         C 152 326, 196 338, 236 352 
         C 236 358, 230 364, 222 366 
         C 180 364, 138 354, 106 342 
         C 107 334, 109 330, 112 328 
         Z" 
      fill="#C4B5FD" 
      stroke="#A78BFA" 
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
      fill="#C4B5FD" 
      stroke="#A78BFA" 
      stroke-width="1.5" 
    />

    <!-- 5. Minimalist Foundation Line / Book Base: Crisp Pure White (#FFFFFF) -->
    <path 
      d="M 96 350 
         C 142 376, 202 378, 256 360 
         C 310 378, 370 376, 416 350" 
      fill="none" 
      stroke="#FFFFFF" 
      stroke-width="16" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
    />
  </g>
</svg>"""

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

    # 4. HORIZONTAL DARK LOGO (920x320)
    horizontal_dark_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 320" width="920" height="320" fill="none">
  <defs>
    <linearGradient id="logo-dark-flame-h" x1="256" y1="208" x2="256" y2="348" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#C084FC" />
      <stop offset="50%" stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#6D28D9" />
    </linearGradient>
    <linearGradient id="logo-dark-border-h" x1="0" y1="0" x2="920" y2="320" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.45" />
      <stop offset="50%" stop-color="#A855F7" stop-opacity="0.20" />
      <stop offset="100%" stop-color="#6D28D9" stop-opacity="0.35" />
    </linearGradient>
    <radialGradient id="logo-dark-bg-h" cx="20%" cy="50%" r="80%">
      <stop offset="0%" stop-color="#140E26" />
      <stop offset="65%" stop-color="#0A0714" />
      <stop offset="100%" stop-color="#05030A" />
    </radialGradient>
  </defs>

  <rect width="920" height="320" rx="36" fill="url(#logo-dark-bg-h)" stroke="url(#logo-dark-border-h)" stroke-width="2" />

  <!-- EMBLEM SCALED ON LEFT -->
  <g transform="translate(24, 0) scale(0.62)">
    <!-- Radiating Sunburst Rays -->
    <line x1="256" y1="88" x2="256" y2="124" stroke="#A855F7" stroke-width="12" stroke-linecap="round" />
    <line x1="204" y1="116" x2="224" y2="134" stroke="#C4B5FD" stroke-width="11" stroke-linecap="round" />
    <line x1="308" y1="116" x2="288" y2="134" stroke="#C4B5FD" stroke-width="11" stroke-linecap="round" />
    <line x1="182" y1="156" x2="204" y2="160" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" />
    <line x1="330" y1="156" x2="308" y2="160" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" />

    <!-- Upward Arrow -->
    <path d="M 256 142 L 286 182 L 266 182 L 266 210 L 246 210 L 246 182 L 226 182 Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" />

    <!-- Central Flame -->
    <path d="M 246 208 C 246 226, 204 246, 200 278 C 196 308, 230 334, 256 348 C 282 334, 316 308, 312 278 C 308 246, 266 226, 266 208 Z" fill="url(#logo-dark-flame-h)" stroke="#A855F7" stroke-width="1.5" />

    <!-- Book Pages -->
    <path d="M 112 328 C 152 326, 196 338, 236 352 C 236 358, 230 364, 222 366 C 180 364, 138 354, 106 342 C 107 334, 109 330, 112 328 Z" fill="#C4B5FD" stroke="#A78BFA" stroke-width="1.5" />
    <path d="M 400 328 C 360 326, 316 338, 276 352 C 276 358, 282 364, 290 366 C 332 364, 374 354, 406 342 C 405 334, 403 330, 400 328 Z" fill="#C4B5FD" stroke="#A78BFA" stroke-width="1.5" />

    <!-- Foundation Arc -->
    <path d="M 96 350 C 142 376, 202 378, 256 360 C 310 378, 370 376, 416 350" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- TYPOGRAPHY ON RIGHT -->
  <g transform="translate(360, 0)">
    <text x="0" y="152" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Plus Jakarta Sans', sans-serif" 
          font-size="72" 
          font-weight="800" 
          letter-spacing="-1.5" 
          fill="#FFFFFF">Engez Nafsak</text>

    <text x="2" y="224" 
          font-family="'Noto Sans Arabic', 'Cairo', 'Almarai', 'Segoe UI', Tahoma, sans-serif" 
          font-size="48" 
          font-weight="700" 
          letter-spacing="0.5" 
          fill="#C084FC">إنجز نفسك</text>
  </g>
</svg>"""

    # File mapping
    file_map = {
        "public/engez_brand_emblem.svg": official_light_emblem_svg,
        "public/engez_brand_emblem_dark.svg": official_dark_emblem_svg,
        "public/engez_brand_logo.svg": horizontal_light_svg,
        "public/engez_brand_logo_dark.svg": horizontal_dark_svg,
        "public/logo.svg": official_light_emblem_svg,
        "public/logo_dark.svg": official_dark_emblem_svg,
        "public/minimal_logo.svg": official_light_emblem_svg,
        "public/minimal_logo_dark.svg": official_dark_emblem_svg,
        "public/favicon.svg": official_light_emblem_svg,
        "public/favicon_dark.svg": official_dark_emblem_svg,
        "dist/engez_brand_emblem.svg": official_light_emblem_svg,
        "dist/engez_brand_emblem_dark.svg": official_dark_emblem_svg,
        "dist/engez_brand_logo.svg": horizontal_light_svg,
        "dist/engez_brand_logo_dark.svg": horizontal_dark_svg,
        "dist/logo.svg": official_light_emblem_svg,
        "dist/logo_dark.svg": official_dark_emblem_svg,
        "dist/minimal_logo.svg": official_light_emblem_svg,
        "dist/minimal_logo_dark.svg": official_dark_emblem_svg,
        "dist/favicon.svg": official_light_emblem_svg,
        "dist/favicon_dark.svg": official_dark_emblem_svg,
    }

    for path, content in file_map.items():
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {path}")

    # Generate matching PNGs for Light and Dark modes using Postscript + Ghostscript
    # 1. Light Postscript
    ps_light = """%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 512 512
%%Pages: 1
%%LanguageLevel: 3
%%EndComments

%%Page: 1 1
gsave

/roundrect {
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

0.98 0.972 0.96 setrgbcolor
0 0 512 512 72 roundrect fill

0.91 0.843 0.788 setrgbcolor
2 setlinewidth
2 2 508 508 70 roundrect stroke

256 256 translate
0.95 0.95 scale
-256 -256 translate

0.788 0.435 0.333 setrgbcolor
250 388 12 38 6 roundrect fill

gsave
0.875 0.753 0.663 setrgbcolor
207 385 translate
38 rotate
-6 -15 11 30 5.5 roundrect fill
grestore

gsave
0.875 0.753 0.663 setrgbcolor
304 385 translate
-38 rotate
-6 -15 11 30 5.5 roundrect fill
grestore

gsave
0.114 0.114 0.106 setrgbcolor
185 349 translate
75 rotate
-5 -11 10 22 5 roundrect fill
grestore

gsave
0.114 0.114 0.106 setrgbcolor
327 349 translate
-75 rotate
-5 -11 10 22 5 roundrect fill
grestore

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

0.875 0.753 0.663 setrgbcolor
newpath
112 212 moveto
152 214 196 200 236 180 curveto
236 174 232 168 226 166 curveto
182 168 140 178 105 194 curveto
106 204 108 210 112 212 curveto
closepath
fill

newpath
400 212 moveto
360 214 316 200 276 180 curveto
276 174 280 168 286 166 curveto
330 168 372 178 407 194 curveto
406 204 404 210 400 212 curveto
closepath
fill

0.114 0.114 0.106 setrgbcolor
16 setlinewidth
1 setlinecap
1 setlinejoin
newpath
96 186 moveto
142 160 202 158 256 176 curveto
310 158 370 160 416 186 curveto
stroke

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

    # 2. Dark Theme Postscript matching obsidian & neon violet website dark palette
    ps_dark = """%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 512 512
%%Pages: 1
%%LanguageLevel: 3
%%EndComments

%%Page: 1 1
gsave

/roundrect {
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

% Deep obsidian background: #0A0714 -> (0.039, 0.027, 0.078)
0.039 0.027 0.078 setrgbcolor
0 0 512 512 72 roundrect fill

% Glowing neon violet border: #8B5CF6 -> (0.545, 0.361, 0.965)
0.545 0.361 0.965 setrgbcolor
3 setlinewidth
2 2 508 508 70 roundrect stroke

256 256 translate
0.95 0.95 scale
-256 -256 translate

% Top Center Ray: Neon Violet #A855F7 -> (0.659, 0.333, 0.969)
0.659 0.333 0.969 setrgbcolor
250 388 12 38 6 roundrect fill

% Top Left Ray: Soft Lavender #C4B5FD -> (0.769, 0.710, 0.992)
gsave
0.769 0.710 0.992 setrgbcolor
207 385 translate
38 rotate
-6 -15 11 30 5.5 roundrect fill
grestore

% Top Right Ray
gsave
0.769 0.710 0.992 setrgbcolor
304 385 translate
-38 rotate
-6 -15 11 30 5.5 roundrect fill
grestore

% Lower Left Ray: Pure White
gsave
1 1 1 setrgbcolor
185 349 translate
75 rotate
-5 -11 10 22 5 roundrect fill
grestore

% Lower Right Ray: Pure White
gsave
1 1 1 setrgbcolor
327 349 translate
-75 rotate
-5 -11 10 22 5 roundrect fill
grestore

% Upward Arrow: Crisp Pure White
1 1 1 setrgbcolor
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

% Book Pages: Soft Lavender #C4B5FD
0.769 0.710 0.992 setrgbcolor
newpath
112 212 moveto
152 214 196 200 236 180 curveto
236 174 232 168 226 166 curveto
182 168 140 178 105 194 curveto
106 204 108 210 112 212 curveto
closepath
fill

newpath
400 212 moveto
360 214 316 200 276 180 curveto
276 174 280 168 286 166 curveto
330 168 372 178 407 194 curveto
406 204 404 210 400 212 curveto
closepath
fill

% Base Spine: Crisp Pure White
1 1 1 setrgbcolor
16 setlinewidth
1 setlinecap
1 setlinejoin
newpath
96 186 moveto
142 160 202 158 256 176 curveto
310 158 370 160 416 186 curveto
stroke

% Central Flame: Vibrant Neon Violet #8B5CF6
0.545 0.361 0.965 setrgbcolor
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

    with open("/tmp/brand_light.ps", "w") as f:
        f.write(ps_light)

    with open("/tmp/brand_dark.ps", "w") as f:
        f.write(ps_dark)

    png_light_targets = [
        "public/logo.png",
        "public/vector_logo.png",
        "public/minimal_logo.png",
        "public/engez_brand_emblem.png",
        "dist/logo.png",
        "dist/vector_logo.png",
        "dist/minimal_logo.png",
        "dist/engez_brand_emblem.png",
    ]

    png_dark_targets = [
        "public/logo_dark.png",
        "public/minimal_logo_dark.png",
        "public/engez_brand_emblem_dark.png",
        "dist/logo_dark.png",
        "dist/minimal_logo_dark.png",
        "dist/engez_brand_emblem_dark.png",
    ]

    for target in png_light_targets:
        cmd = ["gs", "-sDEVICE=pngalpha", "-r144", f"-o{target}", "/tmp/brand_light.ps"]
        subprocess.run(cmd, capture_output=True, text=True)
        print(f"Generated {target}")

    for target in png_dark_targets:
        cmd = ["gs", "-sDEVICE=pngalpha", "-r144", f"-o{target}", "/tmp/brand_dark.ps"]
        subprocess.run(cmd, capture_output=True, text=True)
        print(f"Generated {target}")

if __name__ == "__main__":
    generate_all_brand_assets()
