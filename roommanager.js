class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.drawings = new Map(); // roomId -> drawings array
    }

    createRoom(roomId) {
        this.rooms.set(roomId, new Set());
        this.drawings.set(roomId, []);
    }

    joinRoom(roomId, client) {
        if (!this.rooms.has(roomId)) {
            this.createRoom(roomId);
        }
        this.rooms.get(roomId).add(client);
    }

    leaveRoom(roomId, client) {
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).delete(client);
        }
    }

    getRoomUsers(roomId) {
        return this.rooms.has(roomId) ? this.rooms.get(roomId).size : 0;
    }

    addDrawing(roomId, drawing) {
        if (this.drawings.has(roomId)) {
            this.drawings.get(roomId).push(drawing);
        }
    }

    getDrawings(roomId) {
        return this.drawings.get(roomId) || [];
    }

    clearDrawings(roomId) {
        if (this.drawings.has(roomId)) {
            this.drawings.set(roomId, []);
        }
    }
}

module.exports = RoomManager;