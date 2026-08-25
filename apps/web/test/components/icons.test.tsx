import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  BoltIcon,
  CheckIcon,
  CloseIcon,
  ArrowDownwardIcon,
  BookmarkIcon,
  ScheduleIcon,
  DarkModeIcon,
  LightModeIcon,
  ContentCopyIcon,
  DescriptionIcon,
  ForumIcon,
  PhotoIcon,
  LayersIcon,
  LockIcon,
  OpenInNewIcon,
  PaletteIcon,
  VerifiedUserIcon,
  AutoAwesomeIcon,
  TerminalIcon,
  TextFieldsIcon,
  ThumbUpIcon,
  SwapHorizIcon,
  UploadFileIcon,
  StarsIcon,
  RefreshIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GitHubIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
} from "@/components/icons";

const ALL_ICONS = [
  BoltIcon, CheckIcon, CloseIcon, ArrowDownwardIcon, ArrowBackIcon, ArrowForwardIcon,
  BookmarkIcon, ScheduleIcon, DarkModeIcon, LightModeIcon, ContentCopyIcon, DescriptionIcon,
  ForumIcon, PhotoIcon, LayersIcon, LockIcon, OpenInNewIcon, PaletteIcon, VerifiedUserIcon,
  AutoAwesomeIcon, TerminalIcon, TextFieldsIcon, ThumbUpIcon, SwapHorizIcon, UploadFileIcon,
  StarsIcon, RefreshIcon, ChevronLeftIcon, ChevronRightIcon,
];

describe("Icon components", () => {
  it.each(ALL_ICONS)("%s renders an SVG element", (Icon) => {
    const { container } = render(<Icon />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("accepts size prop", () => {
    const { container } = render(<CheckIcon size={32} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("32");
    expect(svg?.getAttribute("height")).toBe("32");
  });

  it("accepts color prop", () => {
    const { container } = render(<CheckIcon color="red" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("red");
  });

  it("passes className to svg", () => {
    const { container } = render(<CheckIcon className="my-class" />);
    expect(container.querySelector("svg.my-class")).not.toBeNull();
  });
});

describe("GitHubIcon", () => {
  it("renders an SVG", () => {
    const { container } = render(<GitHubIcon />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("uses 16x16 viewBox", () => {
    const { container } = render(<GitHubIcon />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 16 16");
  });
});
