"""Bundles the official XSDs into one JSON file per document family, for validation in the browser.

Only the schemas a document type actually reaches are included (its transitive imports and includes), so
the UBL bundle carries invoices and credit notes rather than every UBL document type. References are
rewritten to bare file names so the in-memory file system of the WebAssembly validator needs no folders.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "build" / "xsd"
OUT = ROOT / "docs" / "schemas"
M2 = pathlib.Path("D:/Tools/m2/repository/com/helger/xsd")
REF = re.compile(r'(<xsd?:(?:import|include)\b[^>]*?\bschemaLocation=")([^"]+)(")')
# An import that names only a namespace, or points at a remote URL. Both must resolve to a bundled file:
# the checker promises the invoice never leaves the browser, so nothing may be fetched from elsewhere.
IMPORT = re.compile(r'<xsd?:import\b[^>]*?/?>', re.S)
NAMESPACE = re.compile(r'\bnamespace="([^"]+)"')
LOCATION = re.compile(r'\bschemaLocation="([^"]+)"')
TARGET = re.compile(r'\btargetNamespace="([^"]+)"')
DOCTYPE = re.compile(r'<!DOCTYPE\b.*?(\[.*?\]\s*)?>', re.S)

# The library these schemas come from removed some schemaLocation attributes and resolves the namespaces
# from these companion artefacts instead.
EXTRA = ["ph-xsds-ccts-cct-schemamodule", "ph-xsds-xmldsig", "ph-xsds-xades132", "ph-xsds-xades141"]


def companion_schemas() -> dict[str, pathlib.Path]:
    import zipfile
    by_namespace: dict[str, pathlib.Path] = {}
    dest = SRC / "extra"
    for artefact in EXTRA:
        jar = next((M2 / artefact).rglob(f"{artefact}-*.jar"))
        with zipfile.ZipFile(jar) as z:
            for name in z.namelist():
                if name.endswith(".xsd"):
                    out = dest / pathlib.PurePosixPath(name).name
                    out.parent.mkdir(parents=True, exist_ok=True)
                    out.write_bytes(z.read(name))
                    match = TARGET.search(out.read_text(encoding="utf-8"))
                    if match:
                        by_namespace.setdefault(match.group(1), out)
    return by_namespace


NAMESPACES = companion_schemas()


def resolve_imports(text: str, here: pathlib.Path) -> str:
    def fix(m: re.Match) -> str:
        tag = m.group(0)
        namespace = NAMESPACE.search(tag)
        location = LOCATION.search(tag)
        if location and "://" not in location.group(1):
            return tag
        if not namespace or namespace.group(1) not in NAMESPACES:
            sys.exit(f"{here.name}: cannot resolve import {tag!r} to a bundled schema")
        local = NAMESPACES[namespace.group(1)]
        if location:
            return tag.replace(location.group(0), f'schemaLocation="{local.name}"')
        return tag.replace(namespace.group(0), f'{namespace.group(0)} schemaLocation="{local.name}"', 1)
    return IMPORT.sub(fix, text)

FAMILIES = {
    "ubl-invoice": SRC / "ubl21" / "maindoc" / "UBL-Invoice-2.1.xsd",
    "ubl-creditnote": SRC / "ubl21" / "maindoc" / "UBL-CreditNote-2.1.xsd",
    "cii": SRC / "cii-d16b" / "data" / "standard" / "CrossIndustryInvoice_100pD16B.xsd",
}


def closure(main: pathlib.Path) -> dict[str, str]:
    files: dict[str, str] = {}
    seen: dict[str, pathlib.Path] = {}
    queue = [main.resolve()]
    while queue:
        path = queue.pop()
        name = path.name
        if name in seen:
            if seen[name] != path:
                sys.exit(f"Two different schemas share the file name {name}: {seen[name]} and {path}")
            continue
        seen[name] = path
        # A DOCTYPE would make the validator try to load a DTD from the internet.
        text = resolve_imports(DOCTYPE.sub("", path.read_text(encoding="utf-8")), path)
        for _, location, _ in REF.findall(text):
            target = (path.parent / location).resolve()
            if not target.exists():
                target = (SRC / "extra" / pathlib.PurePosixPath(location).name).resolve()
            queue.append(target)
        files[name] = REF.sub(lambda m: m.group(1) + pathlib.PurePosixPath(m.group(2)).name + m.group(3), text)
    return files


OUT.mkdir(parents=True, exist_ok=True)
for family, main in FAMILIES.items():
    files = closure(main)
    bundle = {"main": main.name, "files": files}
    target = OUT / f"{family}.json"
    target.write_text(json.dumps(bundle, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{family:15} {len(files):3} schemas  {target.stat().st_size // 1024:5} KB")
