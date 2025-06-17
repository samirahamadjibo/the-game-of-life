import { isPlatformBrowser } from "@angular/common";
import { Component, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID, HostListener } from "@angular/core";
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule
  ],
})
export class GameComponent implements AfterViewInit {
  @ViewChild('gameCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer', { static: true }) container!: ElementRef<HTMLDivElement>;

  private ctx!: CanvasRenderingContext2D | null;
  private cellSize = 16;
  private minCellSize = 10;
  private maxCellSize = 16;
  private rows: number;
  private cols: number;
  private grid: Set<string>;
  public running = false;
  private isBrowser: boolean;
  public population: number;
  public generation: number;
  private populationDied: boolean;

  
  private shapes = [
    // Glider pattern
    [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
    // Toad pattern
    [[1, 0], [1, 1], [1, 2], [0, 1], [0, 2], [0, 3]],

  // Lightweight Spaceship pattern (LWSS)
  [[0, 1], [0, 4], [1, 0], [2, 0], [2, 4], [3, 0], [3, 1], [3, 2], [3, 3]],

  // Glider Gun pattern (Simplified)
  [
    [5, 1], [5, 2], [6, 1], [6, 2], [5, 11], [6, 11], [7, 11], [4, 12], [8, 12],
    [3, 13], [9, 13], [3, 14], [9, 14], [6, 15], [4, 16], [8, 16], [5, 17], [6, 17], [7, 17],
    [6, 18], [3, 21], [4, 21], [5, 21], [3, 22], [4, 22], [5, 22], [2, 23], [6, 23],
    [1, 25], [2, 25], [6, 25], [7, 25],
    [3, 35], [4, 35], [3, 36], [4, 36]
  ],

  // Gosper Glider Gun (Complete)
  [
    [5, 1], [5, 2], [6, 1], [6, 2],
    [3, 13], [4, 12], [5, 11], [6, 11], [7, 11], [8, 12], [9, 13], [4, 14], [8, 14], [5, 15], [6, 15], [7, 15],
    [6, 16],
    [3, 21], [4, 21], [5, 21], [3, 22], [4, 22], [5, 22], [2, 23], [6, 23],
    [1, 25], [2, 25], [6, 25], [7, 25], [3, 35], [4, 35], [3, 36], [4, 36],
    [23, 0], [23, 1], [23, 2], [23, 4], [23, 5], [23, 6], [24, 3], [25, 3], [26, 3], [22, 3]
  ],

  // Queen Bee Shuttle
  [
    [7, 0], [8, 0], [9, 0], [6, 1], [10, 1],
    [5, 2], [11, 2], [5, 3], [11, 3], [7, 4], [8, 4], [9, 4], [6, 5], [10, 5],
    [0, 7], [1, 7], [2, 7], [3, 7], [0, 8], [1, 8], [2, 8], [3, 8]
  ],

  // B52 Bomber
  [
    [0, 2], [0, 3], [0, 4], [1, 1], [1, 5], [2, 0], [2, 6], [3, 0], [3, 6], [4, 1], [4, 5], [5, 2], [5, 3], [5, 4]
  ]
  ];


  constructor(@Inject(PLATFORM_ID) private platformId: Object, public dialog: MatDialog) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.rows = 0;
    this.cols = 0;
    this.grid = new Set();
    this.population = 0;
    this.generation = 0;
    this.populationDied = false;
  }

 

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        this.ctx = this.canvas.nativeElement.getContext('2d');
        this.resizeCanvas();
        this.addRandomShape();
      }, 50);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.isBrowser) {
      this.resizeCanvas();
    }
  }

  private resizeCanvas() {
    if (!this.isBrowser) return;
    const containerWidth = this.container.nativeElement.clientWidth;
    const containerHeight = this.container.nativeElement.clientHeight;

    this.canvas.nativeElement.width = containerWidth;
    this.canvas.nativeElement.height = containerHeight;

    this.rows = Math.ceil(this.canvas.nativeElement.height / this.cellSize);
    this.cols = Math.ceil(this.canvas.nativeElement.width / this.cellSize);
    this.drawGrid();
  }

  private runGame() {
    if (!this.running || !this.isBrowser) return;
    if (this.population === 0) {
      this.running = false;
      this.populationDied = true;
      return;
    }

    if (this.cellSize != this.minCellSize && this.shouldShrinkCells()) {
      this.shrinkCellsAndRecenter();
    }

    this.grid = this.getNextGeneration(this.grid);
    this.drawGrid();
    this.generation++;

    let delay;
    if (this.cellSize >= 10) delay = 90;
    setTimeout(() => this.runGame(), delay);
  }

  addRandomShape() {
    this.resetGrid(this.maxCellSize)
    const randomShape = this.shapes[Math.floor(Math.random() * this.shapes.length)];    

    for (const [r, c] of randomShape) {
      const newRowCentered = Math.floor(this.rows / 2) + r;
      const newColCentered =  Math.floor(this.cols / 2) + c;
      
      const newRow = Math.floor(this.rows / 3) + r;
      const newCol =  Math.floor(this.cols / 3) + c;
      
      const newRowOffet = Math.floor(this.rows / 4) + r;
      const newColOfftet =  Math.floor(this.cols / 4) + c;

      if (randomShape.length >= 40) {
        this.grid.add(`${newRowOffet},${newColOfftet}`);
      }
      else if (randomShape.length >= 15) this.grid.add(`${newRow},${newCol}`);
      else this.grid.add(`${newRowCentered},${newColCentered}`);
    }

    this.drawGrid()
  }

  private drawGrid() {
    if (!this.isBrowser) return;
    this.ctx?.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.population = 0;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cellAlive = this.grid.has(`${row},${col}`);
        if (cellAlive) this.population++;

        this.drawRoundedRect(this.ctx, col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize, 6);
        this.ctx!.fillStyle = cellAlive ? '#D5EF68' : '#212020';
        this.ctx?.fill();
      }
    }
  }

  private getNextGeneration(grid: Set<string>): Set<string> {
    const newGrid = new Set<string>();
    const neighborCounts = new Map<string, number>();

    for (const cell of grid) {
      const [row, col] = cell.split(',').map(Number);
      this.updateNeighborCounts(neighborCounts, row, col);

      const count = this.countNeighbors(grid, row, col);
      if (count === 2 || count === 3) newGrid.add(cell);
    }

    for (const [cell, count] of neighborCounts.entries()) {
      if (count === 3) newGrid.add(cell);
    }

    return newGrid;
  }

  private updateNeighborCounts(neighborCounts: Map<string, number>, row: number, col: number) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const neighbor = `${row + i},${col + j}`;
        neighborCounts.set(neighbor, (neighborCounts.get(neighbor) || 0) + 1);
      }
    }
  }

  private countNeighbors(grid: Set<string>, row: number, col: number): number {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        if (grid.has(`${row + i},${col + j}`)) count++;
      }
    }
    return count;
  }

  handleCanvasClick(event: MouseEvent) {
    if (!this.isBrowser) return;
    if (this.populationDied) this.generation = 0;

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (this.isWithinBounds(col, row)) {
      const cellKey = `${row},${col}`;
      if (this.grid.has(cellKey)) {
        this.grid.delete(cellKey);
      } else {
        this.grid.add(cellKey);
      }
      this.drawGrid();
    }
  }

  toggleRunning() {
    if (!this.isBrowser) return;
    this.running = !this.running;
    if (this.running) {
      this.runGame();
    }
  }

  resetGrid(cellSize: number = this.maxCellSize) {
    if (!this.isBrowser) return;
    this.cellSize = cellSize;
    this.grid.clear();
    this.drawGrid();
    this.resizeCanvas();
    this.running = false;
    this.generation = 0;
    this.populationDied = false;
  }

  private isWithinBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  showInfo() {
    this.dialog.open(DialogComponent);
  }

  private centerGrid() {
    const newRows = Math.floor(this.canvas.nativeElement.height / this.cellSize);
    const newCols = Math.floor(this.canvas.nativeElement.width / this.cellSize);
    const newGrid = new Set<string>();

    const rowOffset = Math.floor((newRows - this.rows) / 2);
    const colOffset = Math.floor((newCols - this.cols) / 2);

    for (const cell of this.grid) {
      const [row, col] = cell.split(',').map(Number);
      const newRow = row + rowOffset;
      const newCol = col + colOffset;
      if (newRow >= 0 && newRow < newRows && newCol >= 0 && newCol < newCols) {
        newGrid.add(`${newRow},${newCol}`);
      }
    }

    this.rows = newRows;
    this.cols = newCols;
    this.grid = newGrid;
  }

  private shouldShrinkCells(): boolean {
    let padding = 2;
    for (const cell of this.grid) {
      const [row, col] = cell.split(',').map(Number);
      if (row === padding || row === this.rows - padding + 1 || col === padding || col === this.cols - padding + 1) {
        return true;
      }
    }
    return false;
  }

  private shrinkCellsAndRecenter() {
    this.cellSize = Math.max(this.minCellSize, this.cellSize - 1);
    this.centerGrid()
    this.resizeCanvas();
  }

  private drawRoundedRect(ctx:any, x:number, y:number, width: number, height: number, radius: number) {
    let corners = {tl: radius, tr: radius, br: radius, bl: radius}

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#313131';
    ctx.beginPath();
    ctx.moveTo(x + corners.tl, y);
    ctx.lineTo(x + width - corners.tr, y);
    ctx.arcTo(x + width, y, x + width, y + corners.tr, corners.tr);
    ctx.lineTo(x + width, y + height - corners.br);
    ctx.arcTo(x + width, y + height, x + width - corners.br, y + height, corners.br);
    ctx.lineTo(x + corners.bl, y + height);
    ctx.arcTo(x, y + height, x, y + height - corners.bl, corners.bl);
    ctx.lineTo(x, y + corners.tl);
    ctx.arcTo(x, y, x + corners.tl, y, corners.tl);
    ctx.closePath();
    ctx.stroke();
}
}

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  standalone: true,
  imports: [MatDialogModule],
})
export class DialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
