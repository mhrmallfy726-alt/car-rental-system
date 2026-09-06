from pathlib import Path
from PIL import Image

source = Path('documentation/context-diagram-reference-layout.png')
target = Path('documentation/context-diagram-reference-layout.pdf')
image = Image.open(source).convert('RGB')
image.save(target, 'PDF', resolution=150.0)
print(target)
