import subprocess
import os

def create_png_logos():
    os.makedirs("public", exist_ok=True)
    os.makedirs("dist", exist_ok=True)

    # PostScript representation of our brand logo
    ps_content = """%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 512 512
%%Pages: 1
%%LanguageLevel: 3
%%EndComments

%%Page: 1 1
gsave

% Rounded rect helper
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
% Top Center Ray (Terracotta: #C96F55 -> 0.788, 0.435, 0.333)
0.788 0.435 0.333 setrgbcolor
250 388 12 38 6 roundrect fill

% Top Left Ray (Soft Sand/Peach: #DFC0A9 -> 0.875, 0.753, 0.663)
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

% Lower Left Ray (Black: #1D1D1B -> 0.114, 0.114, 0.106)
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

% 2. UPWARD ARROW (Black)
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

% 5. WINDING ROAD (Terracotta)
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
    with open("/tmp/new_logo.ps", "w") as f:
        f.write(ps_content)

    targets = [
        "public/logo.png",
        "public/vector_logo.png",
        "public/minimal_logo.png",
        "dist/logo.png",
        "dist/vector_logo.png",
        "dist/minimal_logo.png",
    ]

    for target in targets:
        cmd = ["gs", "-sDEVICE=pngalpha", "-r144", f"-o{target}", "/tmp/new_logo.ps"]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"Generated {target}")
        else:
            print(f"Error for {target}: {res.stderr}")

if __name__ == "__main__":
    create_png_logos()
