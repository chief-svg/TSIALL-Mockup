#!/usr/bin/env python3
"""Build Summary and Consult Note HTML (and PDF when Chrome is available) from two markdown files.

Usage: build_package.py <summary.md> <note.md> <output-prefix>
Note markdown convention: a cue block
    ::: cue Add if discussed
    - item
    :::
followed by a fenced code block becomes a two-column row (cues left, note text right).
Plain fenced blocks become full-width copy blocks. Headings, paragraphs, lists render normally.
"""
import re, sys, html, os, subprocess, shutil

CSS = """@page{size:Letter;margin:0.7in 0.75in}body{font-family:Georgia,'Times New Roman',serif;font-size:10.5pt;line-height:1.42;color:#111;max-width:8.5in;margin:0 auto;padding:24px}
h1{font-size:19pt;margin:0 0 4pt}h2{font-size:13.5pt;margin:18pt 0 6pt;border-bottom:1px solid #999;padding-bottom:2pt;page-break-after:avoid}
h3{font-size:10.5pt;margin:12pt 0 4pt;font-family:Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.04em;color:#333;page-break-after:avoid}
p{margin:0 0 7pt;orphans:3;widows:3}ul,ol{margin:0 0 7pt 18pt;padding:0}li{margin-bottom:3pt}
pre{font-family:Menlo,Consolas,monospace;font-size:8.6pt;white-space:pre-wrap;background:#f5f5f5;border:1px solid #ccc;padding:8pt;line-height:1.4;margin:0 0 8pt}
.sub{color:#555;font-size:10pt;margin-bottom:12pt}
.row{display:grid;grid-template-columns:2.05in 1fr;gap:10pt;margin:0 0 10pt;page-break-inside:avoid}.row.long{page-break-inside:auto}
.cue{font-family:Helvetica,Arial,sans-serif;font-size:8.3pt;line-height:1.35;color:#222;background:#eef3f4;border-left:3px solid #2a6f7f;padding:6pt 8pt}
.cue b{display:block;font-size:8.5pt;text-transform:uppercase;letter-spacing:.04em;color:#2a6f7f;margin-bottom:3pt}.cue ul{margin:0 0 0 12pt;padding:0}.cue li{margin-bottom:2pt}
.note{font-family:Helvetica,Arial,sans-serif;font-size:8.6pt;color:#444;background:#fff8e6;border:1px solid #e6d8a8;padding:6pt 8pt;margin:0 0 10pt}
.copy{font:11px Helvetica,Arial,sans-serif;margin:0 0 4px;padding:2px 8px;border:1px solid #bbb;background:#fff;cursor:pointer}
@media print{.copy{display:none}}"""

def inline(t):
    t = html.escape(t)
    return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)

def render(md, with_cues):
    out=[]; inlist=None; para=[]; incode=False; code=[]; cue=None; cue_items=[]; n=0
    def flush():
        nonlocal para
        if para: out.append('<p>'+inline(' '.join(para))+'</p>'); para=[]
    def endlist():
        nonlocal inlist
        if inlist: out.append('</%s>'%inlist); inlist=None
    lines = md.split('\n'); i=0
    while i < len(lines):
        s = lines[i].rstrip(); i+=1
        if s.startswith('::: cue'):
            flush(); endlist(); cue = s[7:].strip(); cue_items=[]
            while i < len(lines) and lines[i].strip() != ':::':
                m = re.match(r'^\s*[-*]\s+(.*)', lines[i]);
                if m: cue_items.append(m.group(1))
                i+=1
            i+=1; continue
        if s.startswith('```'):
            flush(); endlist()
            if incode:
                n+=1; text = html.escape('\n'.join(code).strip('\n'))
                pre = '<button class="copy" onclick="cp(%d)">Copy</button><pre id="b%d">%s</pre>'%(n,n,text)
                if cue is not None:
                    long = 'long' if len(text) > 1200 else ''
                    c = '<div class="cue"><b>%s</b><ul>%s</ul></div>'%(html.escape(cue), ''.join('<li>'+inline(x)+'</li>' for x in cue_items))
                    out.append('<div class="row %s">%s<div>%s</div></div>'%(long, c, pre)); cue=None
                else:
                    out.append(pre)
                code=[]; incode=False
            else: incode=True
            continue
        if incode: code.append(s); continue
        if not s.strip(): flush(); endlist(); continue
        m = re.match(r'^(#{1,3})\s+(.*)', s)
        if m: flush(); endlist(); l=len(m.group(1)); out.append('<h%d>%s</h%d>'%(l, inline(m.group(2)), l)); continue
        if s.strip().startswith('>'): flush(); endlist(); out.append('<p class="note">'+inline(s.strip().lstrip('> '))+'</p>'); continue
        m = re.match(r'^\s*[-*]\s+(.*)', s)
        if m:
            flush()
            if inlist!='ul': endlist(); out.append('<ul>'); inlist='ul'
            out.append('<li>'+inline(m.group(1))+'</li>'); continue
        m = re.match(r'^\s*\d+\.\s+(.*)', s)
        if m:
            flush()
            if inlist!='ol': endlist(); out.append('<ol>'); inlist='ol'
            out.append('<li>'+inline(m.group(1))+'</li>'); continue
        if inlist: endlist()
        para.append(s.strip())
    flush(); endlist()
    return '\n'.join(out)

def page(title, body):
    js = "function cp(i){var t=document.getElementById('b'+i).textContent;navigator.clipboard&&navigator.clipboard.writeText(t)}"
    return '<!doctype html><html><head><meta charset="utf-8"><title>%s</title><style>%s</style><script>%s</script></head><body>%s</body></html>'%(html.escape(title), CSS, js, body)

def to_pdf(html_path, pdf_path):
    for c in ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', shutil.which('google-chrome'), shutil.which('chromium')]:
        if c and os.path.exists(c):
            subprocess.run([c, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--print-to-pdf='+pdf_path, 'file://'+os.path.abspath(html_path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return os.path.exists(pdf_path)
    return False

def main():
    summary_md, note_md, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
    s = open(summary_md).read(); nmd = open(note_md).read()
    title_s = re.match(r'^#\s+(.*)', s.strip()).group(1) if s.strip().startswith('#') else 'Summary'
    title_n = re.match(r'^#\s+(.*)', nmd.strip()).group(1) if nmd.strip().startswith('#') else 'Consult Note'
    sp = prefix + '-Summary.html'; np_ = prefix + '-Consult-Note.html'
    open(sp,'w').write(page(title_s, render(s, False)))
    open(np_,'w').write(page(title_n, render(nmd, True)))
    made = [sp, np_]
    for h in [sp, np_]:
        p = h[:-5] + '.pdf'
        if to_pdf(h, p): made.append(p)
    print('\n'.join(made))

if __name__ == '__main__':
    main()
