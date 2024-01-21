class Game {
    constructor(ctx) {
        this.ctx = ctx;
        this.canvw = 400;
        this.buttons = [];
        this.restart();
    }

    restart() {
        this.curline = "";
        this.lines = [];
        this.is_game_over = false;
        this.is_incorrect_word = false
        this.guessed_word = words[Math.floor(Math.random() * words.length)];
        this.kb_state = new Map();
        this.refresh();
    }

    rounded_rect(x, y, w, h, r, fillStyle=0) {
        // Скругленный прямоугольник
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arc(x + w - r, y + r, r, -Math.PI/2, 0, false);
        ctx.lineTo(x + w, y + h - r);
        ctx.arc(x + w - r, y + h - r, r, 0, Math.PI/2, false);
        ctx.lineTo(x + w - r, y + h);
        ctx.arc(x + r, y + h - r, r, Math.PI/2, Math.PI, false);
        ctx.lineTo(x, y + h - r);
        ctx.arc(x + r, y + r, r, Math.PI, -Math.PI/2, false);
        if (fillStyle == 0) {
            ctx.stroke();
        } else {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
    }

    draw_cell(x, y, w, h, r, text, state=-1, is_incorrect=false) {
        const fontSize = w * 0.8;
        var fillRect = "";
        var fillText = "";
        if (state == 0) {
            fillRect = "#555555";
            fillText = "#FFFFFF";
        } else if (state == 1) {
            fillRect = "#FFFFFF";
            fillText = "#000000";
        } else if (state == 2) {
            fillRect = "#E0E050";
            fillText = "#000000";
        } else {
            fillRect = 0;
            fillText = "#FFFFFF";
        }
        if (is_incorrect) {
            fillText = "#700000"
        }
        this.rounded_rect(x, y, w, h, r, fillRect);
        if (text != "") {
            this.ctx.fillStyle = fillText;
            text = text.toUpperCase();
            this.ctx.font = `${fontSize}px sans-serif`;
            this.ctx.textBaseline = "middle";
            this.ctx.textAlign = "center";
            this.ctx.fillText(text, x + w/2, y + h*0.55);
        }
    }

    draw_game_field() {
        const letw = Math.floor(this.canvw * 0.16);
        const leth = letw;
        const xoffset = Math.floor(this.canvw * 0.05);
        const yoffset = xoffset;
        const padxy = Math.floor(this.canvw * 0.025);
        const rrad = padxy;

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#E0E050";
        for (let j = 0; j < 6; j++) {
            for (let i = 0; i < 5; i++) {
                var state = -1;
                var text = "";
                var is_incorrect = false;
                if (this.lines.length > j) {
                    text = this.lines[j].word[i];
                    state = this.lines[j].result[i];
                } else if (this.lines.length == j && this.curline.length > i) {
                    text = this.curline[i];
                    is_incorrect = this.is_incorrect_word;
                }
                this.draw_cell(xoffset+i*(padxy+letw), yoffset+j*(padxy+leth), letw, leth, rrad, text, state, is_incorrect);
            }
        }
    }

    draw_kb_button_letter(x, y, w, h, r, text) {
        const fontSize = w * 0.8;
        const state = this.kb_state.get(text);
        if (state == 1) {
            this.rounded_rect(x, y, w, h, r, "#555555");
            this.ctx.fillStyle = "#FFFFFF";
        } else if (state == 2) {
            this.rounded_rect(x, y, w, h, r, "#FFFFFF");
            this.ctx.fillStyle = "#000000";
        } else if (state == 3) {
            this.rounded_rect(x, y, w, h, r, "#F1DD00");
            this.ctx.fillStyle = "#000000";
        } else  {
            this.rounded_rect(x, y, w, h, r);
            this.ctx.fillStyle = "#FFFFFF";
        }
        this.ctx.font = `${fontSize}px sans-serif`;
        this.ctx.textBaseline = "middle";
        this.ctx.textAlign = "center";
        this.ctx.fillText(text, x + w/2, y + h*0.55);
    }

    draw_kb_button_ok(x, y, w, h, r, state=false) {
        const ctx = this.ctx;
        let fillStyle = "";
        let strokeStyle = "";
        if (state) {
            fillStyle = "#F1DD00";
            strokeStyle = "#000000";
        } else {
            fillStyle = "#555555";
            strokeStyle = "#FFFFFF";
        }
        this.rounded_rect(x, y, w, h, r, fillStyle);
        y += 0.05 * w;
        ctx.beginPath();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.moveTo(x + w * 0.330, y + 0.460 * w);
        ctx.lineTo(x + w * 0.466, y + 0.578 * w);
        ctx.lineTo(x + w * 0.667, y + 0.356 * w);
        ctx.stroke();
    }

    draw_kb_button_back(x, y, w, h, r, state=false) {
        const ctx = this.ctx;
        let fillStyle = "";
        let strokeStyle = "";
        if (state) {
            fillStyle = "#FFFFFF";
            strokeStyle = "#000000";
        } else {
            fillStyle = "#555555";
            strokeStyle = "#FFFFFF";
        }
        this.rounded_rect(x, y, w, h, r, fillStyle);
        y += 0.05 * w;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(x + w * 0.244, y + 0.467 * w);
        ctx.lineTo(x + w * 0.422, y + 0.311 * w);
        ctx.lineTo(x + w * 0.711, y + 0.311 * w);
        ctx.lineTo(x + w * 0.711, y + 0.644 * w);
        ctx.lineTo(x + w * 0.711, y + 0.644 * w);
        ctx.lineTo(x + w * 0.422, y + 0.644 * w);
        ctx.lineTo(x + w * 0.244, y + 0.467 * w);

        ctx.moveTo(x + w * 0.467, y + 0.400 * w);
        ctx.lineTo(x + w * 0.622, y + 0.556 * w);
        ctx.moveTo(x + w * 0.622, y + 0.400 * w);
        ctx.lineTo(x + w * 0.467, y + 0.556 * w);

        ctx.stroke();
    }

    draw_keyboard() {
        const letw = Math.floor(this.canvw * 0.0675); // 27
        const leth = Math.floor(this.canvw * 0.1075); // 43
        const sbutw = letw * 1.5;
        const sbuth = leth;
        const padxy = Math.floor(letw * 0.2);
        const rrad = Math.floor(this.canvw * 0.015); // 6
        let letters = [
            ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"],
            ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"],
            ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю"],
        ];

        this.buttons = [];
        this.ctx.strokeStyle = "#555555"
        for (let j = 0; j < 3; j++) {
            let letn = letters[j].length;
            let xoffset = Math.floor((this.canvw - letw * letn - padxy * (letn-1)) / 2);
            let yoffset = Math.floor(this.canvw * 1.25 + leth * 1.5 * j);
            for (let i = 0; i < letn; i++) {
                this.ctx.lineWidth = 1;
                let x = xoffset+i*(padxy+letw);
                let y = yoffset;
                let w = letw;
                let h = leth;
                if (!this.kb_state.has(letters[j][i])) {
                    this.kb_state.set(letters[j][i], 0);
                }
                this.draw_kb_button_letter(x, y, w, h, rrad, letters[j][i]);
                this.buttons.push({x1: x, y1: y, x2: x+w, y2: y+h, code: letters[j][i]});
            }
            if (j == 2) {
                // Button OK
                var x = xoffset - sbutw - padxy;
                var y = yoffset;
                var w = sbutw;
                var h = sbuth;
                var active = false;
                this.draw_kb_button_ok(x, y, w, h, rrad, (this.curline.length == 5));
                this.buttons.push({x1: x, y1: y, x2: x+w, y2: y+h, code: "OK"});
                // Button Backspace
                x = xoffset + (letw + padxy) * letn;
                y = yoffset;
                w = sbutw;
                h = sbuth;
                this.draw_kb_button_back(x, y, w, h, rrad, (this.curline.length != 0));
                this.buttons.push({x1: x, y1: y, x2: x+w, y2: y+h, code: "BACK"});
            }
        }
    }

    refresh() {
        //console.log("refresh");
        this.ctx.reset();
        // Игровое поле
        this.draw_game_field();
        // Клавиатура
        this.draw_keyboard();
    }

    onclick(event) {
        var elem = document.getElementById('game'),
            elemLeft = elem.offsetLeft + elem.clientLeft,
            elemTop = elem.offsetTop + elem.clientTop;

        var x = event.pageX - elemLeft,
            y = event.pageY - elemTop;
        //console.log("click " + x + "," + y);
        if (this.is_game_over) {
            return;
        }
        for (const btn of this.buttons) {
            if (x >= btn.x1 && x <= btn.x2 && y >= btn.y1 && y <= btn.y2) {
                //console.log("clicked " + btn.code);
                if (btn.code == "BACK") {
                    if (this.curline.length != 0) {
                        this.curline = this.curline.slice(0, -1);
                        this.is_incorrect_word = false;
                        this.refresh();
                    }
                } else if (btn.code == "OK") {
                    if (this.curline.length == 5) {
                        this.check();
                        this.refresh();
                    }
                } else if (this.curline.length < 5) {
                    this.curline += btn.code;
                    this.refresh();
                }
                break;
            }
        }
    }

    check() {
        // TODO проверить слово
        const word = this.curline;
        if (words.includes(word)) {
            let result = [0, 0, 0, 0, 0];
            let used = [0, 0, 0, 0, 0];
            for (let i = 0; i < 5; i++) {
                if (word[i] == this.guessed_word[i]) {
                    result[i] = 2;
                    used[i] = 1;
                    this.kb_state.set(word[i], 3);
                }
            }
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    if (used[j] != 0) {
                        continue;
                    }
                    if (word[i] == this.guessed_word[j]) {
                        result[i] = 1;
                        used[j] = 1;
                    }
                }
            }
            for (let i = 0; i < 5; i++) {
                if (result[i] == 2) {
                    this.kb_state.set(word[i], 3);
                } else if (result[i] == 1 && this.kb_state.get(word[i]) < 2) {
                    this.kb_state.set(word[i], 2);
                } else if (result[i] == 0 && this.kb_state.get(word[i]) < 1) {
                    this.kb_state.set(word[i], 1);
                }
            }
            this.lines.push({word: word, result: result});
            this.curline = "";
            if (this.lines.length == 6 || word == this.guessed_word) {
                this.is_game_over = true;
            }
        } else {
            this.is_incorrect_word = true;
        }
    }
}

function onload() {
    const canvas = document.getElementById("game");
    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");
        window.g = new Game(ctx);
        canvas.addEventListener('click', function(event) {
            window.g.onclick(event);
        }, false);
    }
}
