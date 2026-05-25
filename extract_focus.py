import docx, json

doc = docx.Document('Flow_V1.0_Product_Bible .docx')
texts = [p.text for p in doc.paragraphs]

# Extract Sections 18 and 19 fully
sections = {}
for i, t in enumerate(texts):
    stripped = t.strip()
    if stripped.startswith('18.') or stripped.startswith('19.'):
        key = stripped[:50]
        sections[key] = []
        for j in range(i+1, min(i+120, len(texts))):
            t2 = texts[j].strip()
            if t2.startswith('20.') or (t2 and t2[0].isdigit() and t2.split('.')[0].isdigit() and int(t2.split('.')[0]) > int(stripped.split('.')[0])):
                break
            if t2:
                sections[key].append(t2)

with open('focus_spec.json', 'w', encoding='utf-8') as f:
    json.dump(sections, f, ensure_ascii=False, indent=2)

for k, v in sections.items():
    print(f'{k} ({len(v)} para)')
    for line in v:
        print(f'  {line[:200]}')
    print()
