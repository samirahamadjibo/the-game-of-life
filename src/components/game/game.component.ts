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
  private cellSize = 12;
  private rows: number;
  private cols: number;
  private grid: Set<string>;
  public running = false;
  private isBrowser: boolean;
  public population: number;
  public generation: number;
  private populationDied: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, public dialog: MatDialog) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.rows = 0;
    this.cols = 0;
    this.grid = new Set();
    this.population = 0;
    this.generation = 0;
    this.populationDied = false;
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.ctx = this.canvas.nativeElement.getContext('2d');
      this.resizeCanvas();
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

    this.rows = Math.floor(this.canvas.nativeElement.height / this.cellSize);
    this.cols = Math.floor(this.canvas.nativeElement.width / this.cellSize);
    this.drawGrid();
  }

  private runGame() {
    if (!this.running || !this.isBrowser) return;
    if (this.population === 0) {
      this.running = false;
      this.populationDied = true;
      return;
    }

    this.grid = this.getNextGeneration(this.grid);
    this.drawGrid();
    this.generation++;

    const delay = this.cellSize >= 20 ? 90 : 80;
    setTimeout(() => this.runGame(), delay);
  }

  private drawGrid() {
    if (!this.isBrowser) return;
    this.ctx?.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.population = 0;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cellAlive = this.grid.has(`${row},${col}`);
        if (cellAlive) this.population++;

        const x = col * this.cellSize;
        const y = row * this.cellSize;

        this.ctx?.beginPath();
        this.ctx?.rect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
        
        if (cellAlive) {
          const gradient = this.ctx?.createLinearGradient(x, y, x + this.cellSize, y + this.cellSize);
          gradient?.addColorStop(0, '#6930c3');
          gradient?.addColorStop(1, '#72efdd');
          this.ctx!.fillStyle = gradient!;
        } else {
          this.ctx!.fillStyle = 'white';
        }

        this.ctx?.fill();
        this.ctx!.strokeStyle = this.cellSize >= 20 ? '#EBEBEB' : this.cellSize >= 12 ? '#EBEBEB' : '#EBEBEB';
        this.ctx?.stroke();
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

  resetGrid() {
    if (!this.isBrowser) return;
    this.cellSize = 22;
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
    this.dialog.open(DialogComponent, {
      width: '500px',
    });
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

  randomPattern(){

  }

  zoomOut(){
    this.cellSize = this.cellSize - 2 >= 6 ? this.cellSize -= 2 : this.cellSize;
    this.centerGrid()
    this.resizeCanvas();
  }
  
  zoomIn(){
    this.cellSize = this.cellSize + 2 <= 22 ? this.cellSize += 2 : this.cellSize;
    this.centerGrid()
    this.resizeCanvas();
  }
}

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
})
export class DialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
