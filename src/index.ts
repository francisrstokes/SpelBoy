import { Color, PixelCanvas } from './pixel-canvas';
import * as fs from "fs";
import * as path from "path";

const colours: Color[] = [
  [255, 255, 255],
  [127, 127, 127],
  [63, 63, 63],
  [0, 0, 0],
];

const bin = (n: number) => n.toString(2).padStart(8, '0');
const hex = (n: number) => n.toString(16).padStart(2, '0');

const vram = fs.readFileSync(path.join(__dirname, '..', 'vram2.bin'));
const canvas = document.getElementById('main') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

console.log(vram);

const tileMapAddr = 0x9800 - 0x8000;
const tileAreaAddr = 0x8000 - 0x8000;

const gridEnabled = true;

const pc = new PixelCanvas(canvas);

let scx = 0;
let scy = 0;

const TILE_SIZE = 8;
const PIXELS_PER_ROW = 160;
const PIXELS_PER_COL = 144;
const TILES_PER_ROW = PIXELS_PER_ROW >> 3;
const TILES_PER_COL = PIXELS_PER_COL >> 3;
const TILES_PER_MAP_ROW = 32;
const BYTES_PER_TILE = 16;

//160 × 144 pixels
const frame = () => {
  let horizontalPixelsDrawn = 0;
  for (let y = 0; y < PIXELS_PER_COL; y++) {
    let pixelsSpliced = false;
    while (horizontalPixelsDrawn !== PIXELS_PER_ROW) {
      const scxMod8 = (scx % TILE_SIZE);
      const scyMod8 = (scy % TILE_SIZE);
      const horizontalTile = ((horizontalPixelsDrawn + scx) & 0xff) >> 3;
      const yTile = ((y + scy) & 0xff) >> 3;
      const tileOffset = (yTile * TILES_PER_MAP_ROW) + horizontalTile;

      const tileIndex = vram[tileMapAddr + tileOffset];
      const tileDataAddr = tileAreaAddr + (tileIndex * BYTES_PER_TILE);

      const j = (y + scyMod8) % 8;
      const b0 = vram[tileDataAddr + (j * 2)];
      const b1 = vram[tileDataAddr + (j * 2) + 1];

      const fifo = [];

      for (let k = 7; k >= 0; k--) {
        const pk0 = ((b0 >> k) & 1) << 1;
        const pk1 = ((b1 >> k) & 1);
        const pixelColourKey = pk0 | pk1;
        const color = colours[pixelColourKey];
        fifo.push(color);
      }

      if (!pixelsSpliced) {
        fifo.splice(0, scxMod8);
        pixelsSpliced = true;
      }

      for (const color of fifo) {
        if (horizontalPixelsDrawn === PIXELS_PER_ROW) break;

        pc.pushPixel(color);
        horizontalPixelsDrawn++;
      };
    }
    horizontalPixelsDrawn = 0;
  }
  pc.draw();
}

const drawGrid = () => {
  if (gridEnabled) {
    ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
    for (let d = 0; d < TILES_PER_ROW; d++) {
      ctx.beginPath();
      ctx.moveTo(d * 8, 0);
      ctx.lineTo(d * 8, PIXELS_PER_ROW);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, d * 8);
      ctx.lineTo(PIXELS_PER_ROW, d * 8);
      ctx.closePath();
      ctx.stroke();
    }
  }
}

let frameCount = 0;
const draw = async () => {
  console.log(scx, scx % 8, scx >> 3);
  frame();
  // drawGrid();
  // await delay(1000);
  scx = (scx + 2) & 0xff;
  scy = (scy - 1) & 0xff;
  frameCount++;
  requestAnimationFrame(draw);
}

draw();


