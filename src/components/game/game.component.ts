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
  private cellSize = 25;
  private minCellSize = 15;
  private rows: number;
  private cols: number;
  private grid: boolean[][];
  public running = false;
  private isBrowser: boolean;
  public population: number;
  public generation: number;
  private populationDied: boolean;

  private rPentomino: boolean[][];
  private dieHard: boolean[][];
  private herschel: boolean[][];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, public dialog: MatDialog) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.rows = 100;
    this.cols = 100;
    this.grid = [];
    this.rPentomino = [];
    this.dieHard = [];
    this.herschel = [];
    this.population = 0
    this.generation = 0
    this.populationDied = false;
  }

  setRandomPatterns(){
    const centerRowOffset = Math.floor(this.rows/3);
    const centerColOffset = Math.floor(this.cols/3);
    
    const rowOffset = 10;
    const colOffset = 10;

    
    this.rPentomino = this.createGrid()
    this.herschel = this.createGrid()
    this.dieHard = this.createGrid()

    this.rPentomino[centerRowOffset][centerColOffset+1] = true;
    this.rPentomino[centerRowOffset][centerColOffset+2] = true;
    this.rPentomino[centerRowOffset+1][centerColOffset] = true;
    this.rPentomino[centerRowOffset+1][centerColOffset+1] = true;
    this.rPentomino[centerRowOffset+2][centerColOffset+1] = true;

    this.dieHard[centerRowOffset][centerColOffset+6] = true;
    this.dieHard[centerRowOffset+1][centerColOffset] = true;
    this.dieHard[centerRowOffset+1][centerColOffset+1] = true;
    this.dieHard[centerRowOffset+2][centerColOffset+1] = true;
    this.dieHard[centerRowOffset+2][centerColOffset+5] = true;
    this.dieHard[centerRowOffset+2][centerColOffset+6] = true;
    this.dieHard[centerRowOffset+2][centerColOffset+7] = true;
    
    this.herschel[rowOffset+12][colOffset] = true;
    this.herschel[rowOffset+13][colOffset] = true;
    this.herschel[rowOffset+14][colOffset] = true;
    this.herschel[rowOffset+14][colOffset+1] = true;
    this.herschel[rowOffset+13][colOffset+2] = true;
    this.herschel[rowOffset+14][colOffset+2] = true;
    this.herschel[rowOffset+15][colOffset+2] = true;
    
    this.herschel[rowOffset][colOffset+15] = true;
    this.herschel[rowOffset+1][colOffset+15] = true;
    this.herschel[rowOffset+1][colOffset+16] = true;
    this.herschel[rowOffset+2][colOffset+16] = true;
    this.herschel[rowOffset][colOffset+17] = true;
    
    this.herschel[rowOffset+1][colOffset+32] = true;
    this.herschel[rowOffset+2][colOffset+32] = true;
    this.herschel[rowOffset][colOffset+33] = true;
    this.herschel[rowOffset+3][colOffset+33] = true;
    this.herschel[rowOffset+1][colOffset+34] = true;
    this.herschel[rowOffset+3][colOffset+34] = true;
    this.herschel[rowOffset+2][colOffset+35] = true;
    
  }

  getRandomPattern(){
    if (!this.isBrowser) return;
    this.running = false;
    this.setRandomPatterns();

    if (!this.running) this.generation = 0
    const rand = Math.floor(Math.random() * (4 - 1) + 1)
    if(rand == 1) this.grid = this.rPentomino;
    else if(rand == 3) this.grid = this.herschel;
    else if(rand == 2) this.grid = this.dieHard;

    this.drawGrid();
  }

  ngAfterViewInit() {
    // Only run canvas-related code in the browser
    if (this.isBrowser) {
      this.ctx = this.canvas.nativeElement.getContext('2d');
      this.resizeCanvas();

      this.setRandomPatterns()
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    // Only run canvas-related code in the browser
    if (this.isBrowser) {
      this.resizeCanvas();
    }
  }

  private runGame() {
    if (!this.running || !this.isBrowser) return;
    if (this.population == 0) {
      this.running = false;
      this.populationDied = true;
      return;
    }

    if (this.shouldShrinkCells()) {
      this.shrinkCellsAndRecenter();
    }

    this.grid = this.getNextGeneration(this.grid);
    this.drawGrid();
    this.generation ++;

    if (this.cellSize >= 20) setTimeout(() => this.runGame(), 90)
    else if (this.cellSize >= 15) setTimeout(() => this.runGame(), 80)
    else if (this.cellSize >= 10) setTimeout(() => this.runGame(), 0)
  }


  private resizeCanvas() {
    if (!this.isBrowser) return;
    const containerWidth = this.container.nativeElement.clientWidth;
    const containerHeight = this.container.nativeElement.clientHeight;

    this.canvas.nativeElement.width = containerWidth;
    this.canvas.nativeElement.height = containerHeight;

    this.rows = Math.floor(this.canvas.nativeElement.height / this.cellSize);
    this.cols = Math.floor(this.canvas.nativeElement.width / this.cellSize);
    if (this.grid) {
      const newGrid = this.createGrid();
      for (let row = 0; row < Math.min(this.grid.length, this.rows); row++) {
        for (let col = 0; col < Math.min(this.grid[row].length, this.cols); col++) {
          if (this.grid[row][col] !== undefined) {
            newGrid[row][col] = this.grid[row][col];
          }
        }
      }
      this.grid = newGrid;
    }
    this.drawGrid();
  }

  private createGrid(): boolean[][] {
    return Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
  }

  private drawGrid() {
    if (!this.isBrowser) return;
    this.ctx?.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.population = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if(this.ctx){
          this.ctx.beginPath();
          this.ctx.rect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
          if (this.grid[row][col]){
            this.ctx.fillStyle =  'black' 
            this.population ++;
          }
          else{
            this.ctx.fillStyle =  'white' 
          }
          this.ctx.fill();

          if (this.cellSize >= 20) this.ctx.strokeStyle = '#D6D5D5'
          else if (this.cellSize >= 15) this.ctx.strokeStyle = '#DEDDDD'
          else if (this.cellSize >= 10) this.ctx.strokeStyle = '#EFEFEF'
          this.ctx.stroke();
        }
      }
    }
  }

  handleCanvasClick(event: MouseEvent) {
    if (!this.isBrowser) return;
    if (this.populationDied) this.generation = 0

    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (this.isWithinBounds(col, row)) {
      this.grid[row][col] = !this.grid[row][col];
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
    this.cellSize = 25;
    this.grid = this.createGrid();
    this.drawGrid();
    this.resizeCanvas();
    this.running = false;
    this.generation = 0
    this.populationDied = false;
  }


  private getNextGeneration(grid: boolean[][]): boolean[][] {
    const newGrid = this.createGrid();

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const neighbors = this.countNeighbors(grid, row, col);
        if (grid[row][col]) {
          newGrid[row][col] = neighbors === 2 || neighbors === 3;
        } else {
          newGrid[row][col] = neighbors === 3;
        }
      }
    }

    return newGrid;
  }

  private countNeighbors(grid: boolean[][], row: number, col: number): number {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const x = col + j;
        const y = row + i;
        if (this.isWithinBounds(x, y)) {
          count += grid[y][x] ? 1 : 0;
        }
      }
    }
    return count;
  }

  private isWithinBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  private shouldShrinkCells(): boolean {
    if (this.cellSize <= this.minCellSize) return false;

    for (let row = 0; row < this.rows; row++) {
      if (this.grid[row][0] || this.grid[row][this.cols - 1]) {
        return true;
      }
    }
    for (let col = 0; col < this.cols; col++) {
      if (this.grid[0][col] || this.grid[this.rows - 1][col]) {
        return true;
      }
    }
    return false;
  }

  private shrinkCellsAndRecenter() {
    if (this.cellSize > this.minCellSize) {
      this.cellSize = this.cellSize - 5 < this.minCellSize ? this.cellSize : this.cellSize - 5;
      this.recenterGrid();
      this.resizeCanvas();
    }
  }

  private recenterGrid() {
    const newRows = Math.floor(this.canvas.nativeElement.height / this.cellSize);
    const newCols = Math.floor(this.canvas.nativeElement.width / this.cellSize);
    const newGrid = Array.from({ length: newRows }, () => Array(newCols).fill(false));

    const rowOffset = Math.floor((newRows - this.rows) / 2);
    const colOffset = Math.floor((newCols - this.cols) / 2);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          const newRow = row + rowOffset;
          const newCol = col + colOffset;
          if (newRow >= 0 && newRow < newRows && newCol >= 0 && newCol < newCols) {
            newGrid[newRow][newCol] = this.grid[row][col];
          }
        }
      }
    }

    this.rows = newRows;
    this.cols = newCols;
    this.grid = newGrid;
  }

  showInfo(){
    this.dialog.open(DialogComponent, {
      width: '500px',
    });
  }
}

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
})
export class DialogComponent{
  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}

