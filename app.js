// AnthonyDrawChat frontend logic

// Connection status
function setupConnectionStatus() {
  const el = document.getElementById("connectionStatus");

  const update = () => {
    if (!el) return;
    const online = navigator.onLine;
    el.textContent = online ? "● Online" : "● Offline";
    el.className = "status " + (online ? "connected" : "disconnected");
  };

  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

// Drawing
class DrawingApp {
  constructor() {
    this.canvas = document.getElementById("drawingCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.isDrawing = false;
    this.brushColor = document.getElementById("colorPicker").value;
    this.brushSize = Number(document.getElementById("brushSize").value) || 5;

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.attachEvents();
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height || 500;
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX ?? e.touches[0].clientX) - rect.left,
      y: (e.clientY ?? e.touches[0].clientY) - rect.top
    };
  }

  attachEvents() {
    const colorPicker = document.getElementById("colorPicker");
    const brushSize = document.getElementById("brushSize");
    const clearBtn = document.getElementById("clearCanvas");
    const downloadBtn = document.getElementById("downloadDrawing");

    colorPicker.addEventListener("input", (e) => {
      this.brushColor = e.target.value;
    });

    brushSize.addEventListener("input", (e) => {
      this.brushSize = Number(e.target.value) || 5;
    });

    const start = (e) => {
      e.preventDefault();
      this.isDrawing = true;
      const { x, y } = this.getPos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    };

    const move = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const { x, y } = this.getPos(e);
      this.ctx.lineTo(x, y);
      this.ctx.strokeStyle = this.brushColor;
      this.ctx.lineWidth = this.brushSize;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.stroke();
    };

    const end = (e) => {
      if (e) e.preventDefault();
      this.isDrawing = false;
      this.ctx.closePath();
    };

    // Mouse
    this.canvas.addEventListener("mousedown", start);
    this.canvas.addEventListener("mousemove", move);
    this.canvas.addEventListener("mouseup", end);
    this.canvas.addEventListener("mouseleave", end);

    // Touch
    this.canvas.addEventListener("touchstart", start, { passive: false });
    this.canvas.addEventListener("touchmove", move, { passive: false });
    this.canvas.addEventListener("touchend", end, { passive: false });

    clearBtn.addEventListener("click", () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    });

    downloadBtn.addEventListener("click", () => {
      const link = document.createElement("a");
      link.download = `drawing_${Date.now()}.png`;
      link.href = this.canvas.toDataURL("image/png");
      link.click();
    });
  }
}

// Messaging
class MessagingApp {
  constructor() {
    this.historyEl = document.getElementById("messageHistory");
    this.inputEl = document.getElementById("messageInput");
    this.sendBtn = document.getElementById("sendMessage");

    this.sendBtn.addEventListener("click", () => this.handleSend());
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
  }

  addMessage(role, text) {
    const div = document.createElement("div");
    div.classList.add("message", role);
    div.textContent = text;
    this.historyEl.appendChild(div);
    this.historyEl.scrollTop = this.historyEl.scrollHeight;
  }

  async handleSend() {
    const text = this.inputEl.value.trim();
    if (!text) return;

    this.addMessage("user", text);
    this.inputEl.value = "";

    if (!navigator.onLine) {
      this.addMessage("system", "You are offline. Message not sent.");
      return;
    }

    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "assistant");
    typingDiv.textContent = "Assistant is typing…";
    this.historyEl.appendChild(typingDiv);
    this.historyEl.scrollTop = this.historyEl.scrollHeight;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      typingDiv.textContent = data.reply || "No reply from server.";
    } catch (err) {
      console.error(err);
      typingDiv.textContent = "Error: could not reach server.";
    }
  }
}

// Initialize app
window.addEventListener("DOMContentLoaded", () => {
  setupConnectionStatus();
  new DrawingApp();
  new MessagingApp();
});
