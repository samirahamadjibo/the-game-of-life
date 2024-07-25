import { isPlatformBrowser } from "@angular/common";
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID, HostListener } from "@angular/core";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, AfterViewInit {
  @ViewChild('gameCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D | null;
  private cellSize = 20;
  private rows: number;
  private cols: number;
  private grid: boolean[][];
  public running = false;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.rows = 0;
    this.cols = 0;
    this.grid = [];
  }

  ngOnInit() {
    // Only run canvas-related code in the browser
    if (this.isBrowser) {
      this.resizeCanvas();
      this.resetGrid();
    }
  }

  ngAfterViewInit() {
    // Only run canvas-related code in the browser
    if (this.isBrowser) {
      this.ctx = this.canvas.nativeElement.getContext('2d');
      this.resizeCanvas();
      this.resetGrid();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    // Only run canvas-related code in the browser
    if (this.isBrowser) {
      this.resizeCanvas();
    }
  }

  private resizeCanvas() {
    if (!this.isBrowser) return;
    this.canvas.nativeElement.width = 0.9 * window.innerWidth;
    this.canvas.nativeElement.height = 0.8 * window.innerHeight;
    this.rows = Math.floor(this.canvas.nativeElement.height / this.cellSize);
    this.cols = Math.floor(this.canvas.nativeElement.width / this.cellSize);
    if (this.grid) {
      const newGrid = this.createGrid();
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          if (this.grid[row] && this.grid[row][col] !== undefined) {
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
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if(this.ctx){
          this.ctx.beginPath();
          this.ctx.rect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
          this.ctx.fillStyle = this.grid[row][col] ? 'black' : 'white';
          this.ctx.fill();
          this.ctx.stroke();
        }
      }
    }
  }

  handleCanvasClick(event: MouseEvent) {
    if (!this.isBrowser) return;
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    this.grid[row][col] = !this.grid[row][col];
    this.drawGrid();
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
    this.grid = this.createGrid();
    this.drawGrid();
  }

  private runGame() {
    if (!this.running || !this.isBrowser) return;

    this.grid = this.getNextGeneration(this.grid);
    this.drawGrid();
    requestAnimationFrame(() => this.runGame());
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
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
          count += grid[y][x] ? 1 : 0;
        }
      }
    }
    return count;
  }
}
