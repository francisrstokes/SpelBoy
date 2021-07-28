export type Color = [number, number, number];

const HORIZONTAL_PIXELS = 160;
const VERTICAL_PIXELS = 144;

export interface ILCDScreen {
  pushPixel(color: Color): void;
  draw(): void;
}

export class PixelCanvas implements ILCDScreen {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private buffer: ImageData;
  private pixelIndex: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = HORIZONTAL_PIXELS;
    this.canvas.height = VERTICAL_PIXELS;
    this.ctx = canvas.getContext('2d');
    this.buffer = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  pushPixel([r, g, b]: Color) {
    this.buffer.data[this.pixelIndex * 4 + 0] = r;
    this.buffer.data[this.pixelIndex * 4 + 1] = g;
    this.buffer.data[this.pixelIndex * 4 + 2] = b;
    this.buffer.data[this.pixelIndex * 4 + 3] = 255;
    this.pixelIndex++;
  }

  draw() {
    this.ctx.putImageData(this.buffer, 0, 0);
    this.pixelIndex = 0;
  }
}
