# SF Pro Text in Figma

SF Pro Text is Apple’s system font optimized for text at 19pt and below. This guide covers how to use SF Pro Text in Figma, including installation, available styles, naming conventions, and best practices for Apple platform design.

[TOC]

## Introduction

SF Pro Text is a key part of Apple’s design system, intended for small text sizes to maximize legibility and consistency across iOS, macOS, and other Apple platforms. Using it correctly in Figma ensures your designs match Apple’s standards and look great across devices.

## Installing SF Pro Text in Figma

- Download SF Pro Text from Apple’s official site (requires Apple Developer account).
- Install the font on your system.
- For the Figma desktop app, local fonts are automatically available.
- For Figma in the browser, install the Figma Font Helper to access local fonts[8][13].

## Available Styles and Naming

SF Pro Text in Figma is available in multiple weights and styles. The most common and supported ones are:

| Font Family     | Weights Available                | Italic Styles | Typical Usage         |
|-----------------|----------------------------------|---------------|----------------------|
| SF Pro Text     | Regular, Medium, Semibold, Bold  | Yes           | Body, UI text ≤19pt  |

**Correct style names in Figma:**
- SF Pro Text Regular
- SF Pro Text Medium
- SF Pro Text Semibold
- SF Pro Text Bold
- (and their respective Italics, e.g., SF Pro Text Semibold Italic)[18][19]

## Usage Guidelines

- **When to use:** Use SF Pro Text for any UI text at or below 19pt. For headings or large titles (20pt and above), use SF Pro Display instead[16].
- **Dynamic Type:** Many Figma community files provide ready-made text styles for Apple’s dynamic type sizes, mapped to the correct SF Pro Text weights and sizes[18].
- **Style Consistency:** Use the exact style names as in the font files (e.g., “Semibold” not “Semi Bold”) to avoid mapping issues in Figma and plugins[19].
- **Line Height:** Set line height between 120%–145% of the font size for readability[7].
- **Letter Spacing:** Apple’s guidelines recommend adjusting letter spacing for different sizes. Figma plugins or Apple’s UI kits can help automate this[16].

## Best Practices

- **Install all weights and italics** for full flexibility.
- **Double-check style names** when switching fonts or weights to ensure the correct variant is applied[19].
- **Leverage community files** for pre-built styles and dynamic type mappings[18][20].
- **Use Apple’s UI kit** for Figma for consistent, platform-accurate components and styles[21].

## Example: Creating SF Pro Text Styles in Figma

1. Select the text tool and type your label.
2. Set the font family to “SF Pro Text.”
3. Choose the desired weight (e.g., Regular, Medium, Semibold, Bold).
4. Set the font size (≤19pt for SF Pro Text).
5. Adjust line height (e.g., 130% for body text).
6. Save as a text style for reuse.

## See also

- [SF Pro Text on Figma Community][18]
- [SF Pro Display on Figma Community][20]
- [Apple’s UI Kit for Figma][21]
- [iOS Font Size Guidelines][16]

---

**Summary:**  
SF Pro Text is essential for Apple-style UI design at small sizes in Figma. Install the font locally, use the correct style names, and follow Apple’s guidelines for size and spacing to ensure professional, platform-consistent results.

Sources
[1] Basic Syntax - Markdown Guide https://www.markdownguide.org/basic-syntax/
[2] Getting Started | Markdown Guide https://www.markdownguide.org/getting-started/
[3] Markdown style guide | styleguide - Google https://google.github.io/styleguide/docguide/style.html
[4] Markdown Guide https://www.markdownguide.org
[5] Markdown Editor Syntax Rules and Specifications https://www.oxygenxml.com/doc/versions/27.1/ug-json/topics/markdown-rules.html
[6] Text Properties and Styles - Figma Handbook - Design+Code https://designcode.io/figma-handbook-text-properties-and-styles/
[7] Import the file to Figma - Ant Design System for Figma https://www.antforfigma.com/docs/import-the-file-to-figma
[8] Markdown formatting guide | Range https://www.range.co/help/article/markdown-formatting-guide
[9] How to implement Apple SF Symbols in Figma - delasign https://www.delasign.com/blog/figma-apple-sf-symbols/
[10] Figma plugin for fixing texts with San Francisco typeface. - GitHub https://github.com/charliecm/figma-fix-sf
[11] Basic writing and formatting syntax - GitHub Docs https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
[12] How to Add San Francisco Pro Fonts on Figma Using Windows OS https://www.youtube.com/watch?v=KKz7A3cabeY
[13] Fonts & Typographic Templates for Stunning Content - Figma https://www.figma.com/community/fonts-typography
[14] My_favorite_ai_coding_prompts.md · GitHub https://gist.github.com/eonist/22e7458f9b38424af9d1bfd791b796a4?permalink_comment_id=5182823
[15] The iOS App Font Size Guidelines (iOS 17 update) - Learn UI Design https://learnui.design/blog/ios-font-size-guidelines.html
[16] SF Pro Display Text Changing Unexpectedly in Figma : r/FigmaDesign https://www.reddit.com/r/FigmaDesign/comments/1j46qtz/sf_pro_display_text_changing_unexpectedly_in_figma/
[17] SF Pro Text - Figma https://www.figma.com/community/file/976565288988305493/sf-pro-text
[18] Font Weight - Tokens Studio for Figma https://docs.tokens.studio/token-types/token-type-font-weight
[19] SF Pro Display - Figma https://www.figma.com/community/file/976541707845800013/sf-pro-display
[20] Get started with Apple's UI kit – Figma Learn - Help Center https://help.figma.com/hc/en-us/articles/24037833895831-Get-started-with-Apple-s-UI-kit
