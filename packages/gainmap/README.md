# gainmap

CLI to convert images into Ultra HDR JPEG gain maps (ISO/TS 21496-1). Same keep-base encoder as [gainmaps.com](https://gainmaps.com).

```sh
gainmap photo.jpg
gainmap ./shots
gainmap -R ./shots -o ./out
```

Install, every flag, Docker, and requirements: **[docs/cli.md](../../docs/cli.md)**.

Quick paths:

- Homebrew tap: `brew install kirkstrobeck/tap/gainmap`
- From this clone: `brew install --HEAD --formula ./Formula/gainmap.rb`
- Without brew: `cd packages/gainmap && npm install && npm run build && npm link`
- Docker: `docker build -t gainmap packages/gainmap && docker run --rm -v "$PWD:/work" gainmap photo.jpg`

## Contributing

Contributions are welcome. Open an issue or pull request at [github.com/kirkstrobeck/gainmaps.com](https://github.com/kirkstrobeck/gainmaps.com). See [CONTRIBUTING.md](./CONTRIBUTING.md).
