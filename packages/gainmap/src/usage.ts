import { readPackageVersion } from "#src/version.js";

export function usage(): string {
  return `gainmap ${readPackageVersion()} — convert images to Ultra HDR JPEG (ISO 21496-1 gain maps)

Usage
  gainmap [options] <input...>
  gainmap convert [options] <input...>
  gainmap extract-sdr [options] <input>
  gainmap update

Input is a file, a directory, or - for stdin. Directories convert matching
images in that folder. Use -R/--recursive for nested trees.
extract-sdr writes the primary SDR JPEG (first SOI..EOI) from a gain map.

Output
  -o, --out, --output <path>
                        File (single input), directory (required for recursive
                        or multi-file; mirrors source dirs), or - for stdout
      --out-type <type> Output format when --out is a directory (jpg jpeg png
                        webp avif tif tiff gif). File --out uses the extension;
                        --out-type must agree if both are set. jpg/jpeg write
                        Ultra HDR gain maps; other types encode via sharp. Unknown flags error. HEIC/HEIF/SVG are input only.
      --suffix <str>    Default -gain (photo.jpg -> photo-gain.jpg)
  -i, --in-place        Overwrite the original JPEG (implies force)
  -f, --force           Overwrite existing outputs (e.g. photo-gain.jpg)
      --no-clobber      Skip existing outputs (default)
  -n, --dry-run         Print planned paths, write nothing
      --stdout          Write one conversion to stdout
      --stdin           Read image bytes from stdin

Conversion
  -q, --quality <1-100> Encode quality for JPEG, WebP, and AVIF (default 92)
      --boost <0-1>     HDR boost (default 1)
      --headroom <n>    Explicit headroom; overrides --boost
      --model <name>    highlight (default) | window
      --matte <name>    white (default) | checkerboard
      --max-size <px>   Fit longest edge before encode

Walk
  -R, -r, --recursive   Recurse into directories (flat-only without this)
      --ext <list>      Comma-separated extensions
      --exclude <glob>  Skip matching paths (repeatable)

Runtime
  -j, --jobs <n>        Parallel conversions (default: CPU count, max 8)
  -v, --verbose         Log every file to stderr
      --quiet           Errors only
      --continue        Keep going after a failed file
  -h, --help            Show this help
  -V, --version         Print version
      --update          Upgrade this CLI when a newer release exists
      --self-update     Same as --update
      --no-update-check Skip the update check
      --offline         Same as --no-update-check
      --auto-update     Auto-update if a newer version exists

Exit codes
  0  success   1  conversion error   2  usage / missing / empty input

Examples
  gainmap photo.jpg
  gainmap photo.jpg -o hdr.jpg
  gainmap photo.png
  gainmap photo.png --out dest.webp
  gainmap photo.png --out ./out --out-type webp
  gainmap -R ./shots --out ./out --out-type png
  gainmap -i photo.jpg
  gainmap ./shots
  gainmap -R ./shots -o ./out
  gainmap -R -i ./shots
  gainmap -R --exclude "**/raw/**" ./shots
  gainmap --boost 1 --matte checkerboard logo.jpg
  gainmap -n -R ./shots
  gainmap extract-sdr photo-gain.jpg -o photo-sdr.jpg
  gainmap update

GitHub: https://github.com/kirkstrobeck/gainmaps
Contributions welcome.
`;
}

export const USAGE = usage();
