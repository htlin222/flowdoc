/**
 * 5x7 bitmap font for ASCII printable range (0x20-0x7E).
 *
 * Layout: each glyph is 5 columns × 7 rows. Encoded as 5 bytes per char.
 * For each byte, bits 0..6 represent rows 0..6 (top → bottom); bit 7 is
 * unused. So a column-major bitmap.
 *
 * Patterns are the well-known "GLCD 5x7" font, public-domain, widely used
 * in HD44780 LCD display projects. Used here to rasterize labels into PNG.
 *
 * Anything outside printable ASCII is rendered as a small filled square
 * placeholder (see `glyphFor`).
 */

const FONT_HEX =
  // 0x20 ' '   00 00 00 00 00     0x21 '!'   00 00 5F 00 00
  "0000000000" + "00005F0000" +
  // 0x22 '"'   00 07 00 07 00     0x23 '#'   14 7F 14 7F 14
  "0007000700" + "147F147F14" +
  // 0x24 '$'   24 2A 7F 2A 12     0x25 '%'   23 13 08 64 62
  "242A7F2A12" + "2313086462" +
  // 0x26 '&'   36 49 55 22 50     0x27 '\''  00 05 03 00 00
  "3649552250" + "0005030000" +
  // 0x28 '('   00 1C 22 41 00     0x29 ')'   00 41 22 1C 00
  "001C224100" + "0041221C00" +
  // 0x2A '*'   14 08 3E 08 14     0x2B '+'   08 08 3E 08 08
  "14083E0814" + "08083E0808" +
  // 0x2C ','   00 50 30 00 00     0x2D '-'   08 08 08 08 08
  "0050300000" + "0808080808" +
  // 0x2E '.'   00 60 60 00 00     0x2F '/'   20 10 08 04 02
  "0060600000" + "2010080402" +
  // 0x30 '0'   3E 51 49 45 3E     0x31 '1'   00 42 7F 40 00
  "3E5149453E" + "00427F4000" +
  // 0x32 '2'   42 61 51 49 46     0x33 '3'   21 41 45 4B 31
  "4261514946" + "2141454B31" +
  // 0x34 '4'   18 14 12 7F 10     0x35 '5'   27 45 45 45 39
  "1814127F10" + "2745454539" +
  // 0x36 '6'   3C 4A 49 49 30     0x37 '7'   01 71 09 05 03
  "3C4A494930" + "0171090503" +
  // 0x38 '8'   36 49 49 49 36     0x39 '9'   06 49 49 29 1E
  "3649494936" + "064949291E" +
  // 0x3A ':'   00 36 36 00 00     0x3B ';'   00 56 36 00 00
  "0036360000" + "0056360000" +
  // 0x3C '<'   08 14 22 41 00     0x3D '='   14 14 14 14 14
  "0814224100" + "1414141414" +
  // 0x3E '>'   00 41 22 14 08     0x3F '?'   02 01 51 09 06
  "0041221408" + "0201510906" +
  // 0x40 '@'   32 49 79 41 3E     0x41 'A'   7E 11 11 11 7E
  "324979413E" + "7E1111117E" +
  // 0x42 'B'   7F 49 49 49 36     0x43 'C'   3E 41 41 41 22
  "7F49494936" + "3E41414122" +
  // 0x44 'D'   7F 41 41 22 1C     0x45 'E'   7F 49 49 49 41
  "7F4141221C" + "7F49494941" +
  // 0x46 'F'   7F 09 09 09 01     0x47 'G'   3E 41 49 49 7A
  "7F09090901" + "3E4149497A" +
  // 0x48 'H'   7F 08 08 08 7F     0x49 'I'   00 41 7F 41 00
  "7F0808087F" + "00417F4100" +
  // 0x4A 'J'   20 40 41 3F 01     0x4B 'K'   7F 08 14 22 41
  "2040413F01" + "7F08142241" +
  // 0x4C 'L'   7F 40 40 40 40     0x4D 'M'   7F 02 0C 02 7F
  "7F40404040" + "7F020C027F" +
  // 0x4E 'N'   7F 04 08 10 7F     0x4F 'O'   3E 41 41 41 3E
  "7F0408107F" + "3E4141413E" +
  // 0x50 'P'   7F 09 09 09 06     0x51 'Q'   3E 41 51 21 5E
  "7F09090906" + "3E4151215E" +
  // 0x52 'R'   7F 09 19 29 46     0x53 'S'   46 49 49 49 31
  "7F09192946" + "4649494931" +
  // 0x54 'T'   01 01 7F 01 01     0x55 'U'   3F 40 40 40 3F
  "01017F0101" + "3F4040403F" +
  // 0x56 'V'   1F 20 40 20 1F     0x57 'W'   7F 20 18 20 7F
  "1F2040201F" + "7F2018207F" +
  // 0x58 'X'   63 14 08 14 63     0x59 'Y'   03 04 78 04 03
  "6314081463" + "0304780403" +
  // 0x5A 'Z'   61 51 49 45 43     0x5B '['   00 7F 41 41 00
  "6151494543" + "007F414100" +
  // 0x5C '\\'  02 04 08 10 20     0x5D ']'   00 41 41 7F 00
  "0204081020" + "0041417F00" +
  // 0x5E '^'   04 02 01 02 04     0x5F '_'   40 40 40 40 40
  "0402010204" + "4040404040" +
  // 0x60 '`'   00 01 02 04 00     0x61 'a'   20 54 54 54 78
  "0001020400" + "2054545478" +
  // 0x62 'b'   7F 48 44 44 38     0x63 'c'   38 44 44 44 20
  "7F48444438" + "3844444420" +
  // 0x64 'd'   38 44 44 48 7F     0x65 'e'   38 54 54 54 18
  "384444487F" + "3854545418" +
  // 0x66 'f'   08 7E 09 01 02     0x67 'g'   08 14 54 54 3C
  "087E090102" + "081454543C" +
  // 0x68 'h'   7F 08 04 04 78     0x69 'i'   00 44 7D 40 00
  "7F08040478" + "00447D4000" +
  // 0x6A 'j'   20 40 44 3D 00     0x6B 'k'   7F 10 28 44 00
  "2040443D00" + "7F10284400" +
  // 0x6C 'l'   00 41 7F 40 00     0x6D 'm'   7C 04 18 04 78
  "00417F4000" + "7C04180478" +
  // 0x6E 'n'   7C 08 04 04 78     0x6F 'o'   38 44 44 44 38
  "7C08040478" + "3844444438" +
  // 0x70 'p'   7C 14 14 14 08     0x71 'q'   08 14 14 18 7C
  "7C14141408" + "081414187C" +
  // 0x72 'r'   7C 08 04 04 08     0x73 's'   48 54 54 54 20
  "7C08040408" + "4854545420" +
  // 0x74 't'   04 3F 44 40 20     0x75 'u'   3C 40 40 20 7C
  "043F444020" + "3C4040207C" +
  // 0x76 'v'   1C 20 40 20 1C     0x77 'w'   3C 40 30 40 3C
  "1C2040201C" + "3C4030403C" +
  // 0x78 'x'   44 28 10 28 44     0x79 'y'   0C 50 50 50 3C
  "4428102844" + "0C5050503C" +
  // 0x7A 'z'   44 64 54 4C 44     0x7B '{'   00 08 36 41 00
  "4464544C44" + "0008364100" +
  // 0x7C '|'   00 00 7F 00 00     0x7D '}'   00 41 36 08 00
  "00007F0000" + "0041360800" +
  // 0x7E '~'   04 02 04 08 04
  "0402040804";

const FONT_BYTES: Uint8Array = (() => {
  const buf = new Uint8Array(FONT_HEX.length / 2);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = parseInt(FONT_HEX.substr(i * 2, 2), 16);
  }
  return buf;
})();

export const GLYPH_WIDTH = 5;
export const GLYPH_HEIGHT = 7;
export const GLYPH_ADVANCE = 6; // 5 columns + 1 column gap

/** Returns the 5-byte glyph for `ch`. Falls back to a filled-square placeholder. */
export function glyphFor(ch: string): Uint8Array {
  const code = ch.codePointAt(0) ?? 0;
  if (code < 0x20 || code > 0x7e) {
    // Out-of-range placeholder: a filled 3×5 square centred in 5×7.
    return new Uint8Array([0x00, 0x3e, 0x3e, 0x3e, 0x00]);
  }
  const i = (code - 0x20) * 5;
  return FONT_BYTES.subarray(i, i + 5);
}

/** Width in pixels of a string at the given pixel-scale. */
export function pxWidth(s: string, scale: number): number {
  if (s.length === 0) return 0;
  return s.length * GLYPH_ADVANCE * scale - scale; // last glyph has no trailing gap
}
