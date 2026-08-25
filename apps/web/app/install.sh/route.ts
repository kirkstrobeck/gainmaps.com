/* Ultra mode by Kirk Strobeck */
import { NextResponse } from "next/server";

const TARBALL =
  "https://github.com/kirkstrobeck/gainmaps.com/releases/download/v1.0.0/gainmap-1.0.0.tgz";

const SCRIPT = `#!/bin/sh
# gainmap installer — gainmaps.com/install.sh
# Ultra mode by Kirk Strobeck
set -e

TARBALL="${TARBALL}"
INSTALL_DIR="\${GAINMAP_INSTALL_DIR:-/usr/local/bin}"
LIBEXEC="\$HOME/.gainmap"
TMP="\$(mktemp -d)"
trap 'rm -rf "\$TMP"' EXIT

die() { printf 'gainmap: %s\\n' "\$1" >&2; exit 1; }

command -v node >/dev/null 2>&1 ||
  die "node is required — install from https://nodejs.org"

[ -w "\$INSTALL_DIR" ] ||
  die "\$INSTALL_DIR is not writable — try: GAINMAP_INSTALL_DIR=~/bin sh <(curl -fsSL https://gainmaps.com/install.sh)"

printf 'Downloading gainmap v1.0.0...\\n'
curl -fsSL "\$TARBALL" | tar -xz -C "\$TMP"
mkdir -p "\$LIBEXEC"
cp -r "\$TMP"/package/dist "\$TMP"/package/package.json "\$LIBEXEC/"
cd "\$TMP/package"
npm install --omit=dev --prefix "\$LIBEXEC" .
LAUNCHER="\$INSTALL_DIR/gainmap"
printf '#!/bin/sh\\nexec node "%s/dist/cli.js" "\$@"\\n' "\$LIBEXEC" > "\$LAUNCHER"
chmod 0755 "\$LAUNCHER"
printf 'gainmap installed to %s\\n' "\$LAUNCHER"
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      "Content-Type": "text/x-shellscript",
      "Cache-Control": "no-store",
    },
  });
}
