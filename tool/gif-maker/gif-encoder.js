(function (root) {
  'use strict';

  const palette = new Uint8Array(256 * 3);
  for (let index = 0; index < 256; index += 1) {
    palette[index * 3] = Math.round(((index >> 5) & 7) * 255 / 7);
    palette[index * 3 + 1] = Math.round(((index >> 2) & 7) * 255 / 7);
    palette[index * 3 + 2] = Math.round((index & 3) * 255 / 3);
  }

  function colorIndex(red, green, blue) {
    return ((red >> 5) << 5) | ((green >> 5) << 2) | (blue >> 6);
  }

  function mapPixels(imageData, width, height, dither) {
    const source = imageData.data;
    const result = new Uint8Array(width * height);
    if (!dither) {
      for (let pixel = 0, sourceIndex = 0; pixel < result.length; pixel += 1, sourceIndex += 4) {
        result[pixel] = colorIndex(source[sourceIndex], source[sourceIndex + 1], source[sourceIndex + 2]);
      }
      return result;
    }

    let currentR = new Float32Array(width + 2), currentG = new Float32Array(width + 2), currentB = new Float32Array(width + 2);
    let nextR = new Float32Array(width + 2), nextG = new Float32Array(width + 2), nextB = new Float32Array(width + 2);
    const clamp = value => Math.max(0, Math.min(255, value));
    for (let y = 0; y < height; y += 1) {
      nextR.fill(0); nextG.fill(0); nextB.fill(0);
      for (let x = 0; x < width; x += 1) {
        const pixel = y * width + x;
        const offset = pixel * 4;
        const red = clamp(source[offset] + currentR[x + 1]);
        const green = clamp(source[offset + 1] + currentG[x + 1]);
        const blue = clamp(source[offset + 2] + currentB[x + 1]);
        const index = colorIndex(red, green, blue);
        result[pixel] = index;
        const paletteOffset = index * 3;
        const errorR = red - palette[paletteOffset];
        const errorG = green - palette[paletteOffset + 1];
        const errorB = blue - palette[paletteOffset + 2];
        currentR[x + 2] += errorR * 7 / 16; currentG[x + 2] += errorG * 7 / 16; currentB[x + 2] += errorB * 7 / 16;
        nextR[x] += errorR * 3 / 16; nextG[x] += errorG * 3 / 16; nextB[x] += errorB * 3 / 16;
        nextR[x + 1] += errorR * 5 / 16; nextG[x + 1] += errorG * 5 / 16; nextB[x + 1] += errorB * 5 / 16;
        nextR[x + 2] += errorR / 16; nextG[x + 2] += errorG / 16; nextB[x + 2] += errorB / 16;
      }
      [currentR, nextR] = [nextR, currentR];
      [currentG, nextG] = [nextG, currentG];
      [currentB, nextB] = [nextB, currentB];
    }
    return result;
  }

  class ByteWriter {
    constructor() { this.bytes = []; }
    byte(value) { this.bytes.push(value & 255); }
    short(value) { this.byte(value); this.byte(value >> 8); }
    text(value) { for (let i = 0; i < value.length; i += 1) this.byte(value.charCodeAt(i)); }
    block(data) {
      for (let index = 0; index < data.length; index += 255) {
        const length = Math.min(255, data.length - index);
        this.byte(length);
        for (let cursor = 0; cursor < length; cursor += 1) this.byte(data[index + cursor]);
      }
      this.byte(0);
    }
    result() { return new Uint8Array(this.bytes); }
  }

  function lzwCompress(indices) {
    const clearCode = 256;
    const endCode = 257;
    let codeSize = 9;
    let nextCode = 258;
    let dictionary = new Map();
    const output = [];
    let bitBuffer = 0;
    let bitLength = 0;

    const writeCode = code => {
      bitBuffer |= code << bitLength;
      bitLength += codeSize;
      while (bitLength >= 8) {
        output.push(bitBuffer & 255);
        bitBuffer >>>= 8;
        bitLength -= 8;
      }
    };
    const reset = () => { dictionary = new Map(); codeSize = 9; nextCode = 258; };

    writeCode(clearCode);
    if (!indices.length) {
      writeCode(endCode);
      if (bitLength) output.push(bitBuffer & 255);
      return new Uint8Array(output);
    }

    let prefix = indices[0];
    for (let index = 1; index < indices.length; index += 1) {
      const suffix = indices[index];
      const key = `${prefix},${suffix}`;
      if (dictionary.has(key)) {
        prefix = dictionary.get(key);
      } else {
        writeCode(prefix);
        if (nextCode < 4096) {
          dictionary.set(key, nextCode);
          nextCode += 1;
          // The decoder creates each dictionary entry after reading the next
          // code, so its table is one entry behind the encoder. Grow the code
          // width only after crossing the boundary to stay in lockstep.
          if (nextCode > (1 << codeSize) && codeSize < 12) codeSize += 1;
        } else {
          writeCode(clearCode);
          reset();
        }
        prefix = suffix;
      }
    }
    writeCode(prefix);
    writeCode(endCode);
    if (bitLength) output.push(bitBuffer & 255);
    return new Uint8Array(output);
  }

  function encodeGif({ width, height, frames, loop = true, dither = true, onProgress }) {
    const writer = new ByteWriter();
    writer.text('GIF89a');
    writer.short(width); writer.short(height);
    writer.byte(0xF7); writer.byte(0); writer.byte(0);
    for (const value of palette) writer.byte(value);

    if (loop) {
      writer.byte(0x21); writer.byte(0xFF); writer.byte(0x0B); writer.text('NETSCAPE2.0');
      writer.byte(0x03); writer.byte(0x01); writer.short(0); writer.byte(0);
    }

    frames.forEach((frame, index) => {
      const indices = mapPixels(frame.imageData, width, height, dither);
      const compressed = lzwCompress(indices);
      writer.byte(0x21); writer.byte(0xF9); writer.byte(0x04); writer.byte(0x04);
      writer.short(Math.max(2, Math.round(frame.delay / 10)));
      writer.byte(0); writer.byte(0);
      writer.byte(0x2C); writer.short(0); writer.short(0); writer.short(width); writer.short(height); writer.byte(0);
      writer.byte(8); writer.block(compressed);
      if (onProgress) onProgress((index + 1) / frames.length);
    });
    writer.byte(0x3B);
    return new Blob([writer.result()], { type: 'image/gif' });
  }

  root.LocalGifEncoder = { encodeGif, mapPixels, lzwCompress };
})(globalThis);

