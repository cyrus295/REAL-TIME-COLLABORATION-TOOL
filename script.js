class WhiteboardApp {
    constructor() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.ws = null;
        this.isDrawing = false;
        this.currentTool = 'pencil';
        this.currentColor = '#000000';
        this.currentSize = 3;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupWebSocket();
        this.setupEventListeners();
        this.setupTools();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth - 40;
        this.canvas.height = container.clientHeight - 40;
    }

    setupWebSocket() {
        this.ws = new WebSocket('ws://localhost:8080');
        
        this.ws.onopen = () => {
            this.updateStatus('connected', '✅ Connected');
        };
        
        this.ws.onclose = () => {
            this.updateStatus('disconnected', '❌ Disconnected');
        };
        
        this.ws.onerror = (error) => {
            this.updateStatus('disconnected', '❌ Connection Error');
        };
        
        this.ws.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };
    }

    handleMessage(data) {
        switch(data.type) {
            case 'draw':
                this.drawReceived(data.drawing);
                break;
            case 'clear':
                this.clearCanvas();
                break;
            case 'init':
                data.drawings.forEach(drawing => this.drawReceived(drawing));
                break;
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    setupTools() {
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
        });

        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.currentSize = e.target.value;
            document.getElementById('sizeValue').textContent = this.currentSize + 'px';
        });

        document.getElementById('pencilBtn').addEventListener('click', () => {
            this.setTool('pencil');
        });

        document.getElementById('eraserBtn').addEventListener('click', () => {
            this.setTool('eraser');
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCanvas();
            this.sendClear();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveImage();
        });

        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.currentColor = e.target.dataset.color;
                document.getElementById('colorPicker').value = this.currentColor;
            });
        });
    }

    setTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tool + 'Btn').classList.add('active');
        
        if (tool === 'eraser') {
            this.ctx.strokeStyle = '#FFFFFF';
        } else {
            this.ctx.strokeStyle = this.currentColor;
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;
    }

    draw(e) {
        if (!this.isDrawing) return;

        const currentX = e.offsetX;
        const currentY = e.offsetY;

        const drawing = {
            startX: this.lastX,
            startY: this.lastY,
            endX: currentX,
            endY: currentY,
            color: this.currentTool === 'eraser' ? '#FFFFFF' : this.currentColor,
            size: this.currentSize
        };

        this.drawLine(drawing);
        this.sendDrawing(drawing);

        this.lastX = currentX;
        this.lastY = currentY;
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    drawLine(drawing) {
        this.ctx.beginPath();
        this.ctx.moveTo(drawing.startX, drawing.startY);
        this.ctx.lineTo(drawing.endX, drawing.endY);
        this.ctx.strokeStyle = drawing.color;
        this.ctx.lineWidth = drawing.size;
        this.ctx.stroke();
    }

    drawReceived(drawing) {
        this.ctx.beginPath();
        this.ctx.moveTo(drawing.startX, drawing.startY);
        this.ctx.lineTo(drawing.endX, drawing.endY);
        this.ctx.strokeStyle = drawing.color;
        this.ctx.lineWidth = drawing.size;
        this.ctx.stroke();
    }

    sendDrawing(drawing) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'draw',
                drawing: drawing
            }));
        }
    }

    sendClear() {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'clear'
            }));
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateStatus(status, message) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = status;
    }

    saveImage() {
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WhiteboardApp();
});