"""Create the source download from an explicit source-only allowlist."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
folders = ('app', 'lib', 'scripts', 'tests', 'public')
files = []
for folder in folders:
    for p in (root / folder).rglob('*'):
        if p.is_file() and p.name != 'source.zip' and '__pycache__' not in p.parts:
            files.append(p)
for name in ('package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs', 'next-env.d.ts', 'README.md', '.env.example', '.gitignore', 'vercel.json'):
    p=root/name
    if p.is_file(): files.append(p)
with ZipFile(root/'public/source.zip', 'w', compression=ZIP_DEFLATED) as archive:
    for p in sorted(set(files)):
        relative = p.relative_to(root).as_posix()
        info = ZipInfo('cimp-studio/' + relative, date_time=(2026, 11, 6, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, p.read_bytes())
print(f'Source download: {len(set(files))} files')
