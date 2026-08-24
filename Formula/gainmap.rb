class Gainmap < Formula
  desc "Convert images to Ultra HDR JPEG gain maps"
  homepage "https://gainmaps.com"
  url "https://github.com/kirkstrobeck/gainmaps.com/releases/download/v1.0.0/gainmap-1.0.0.tgz"
  version "1.0.0"
  sha256 "4047c08ee44613c9e3a6b954d2c0efb71165af9ef0619f6ea6acd406468079ba"
  license "MIT"
  head "https://github.com/kirkstrobeck/gainmaps.com.git", branch: "main"

  depends_on "node"

  def install
    cd "package" do
      system "npm", "install", *std_npm_args
      bin.install_symlink libexec/"bin"/"gainmap"
    end
  end

  test do
    assert_match "gainmap", shell_output("#{bin}/gainmap --help")
    assert_match "gainmap 1.0.0", shell_output("#{bin}/gainmap --version 2>&1")
  end
end
