class RNG {
    constructor(seed) {
        // LCG using GCC's constants
        this.m = 0x80000000; // 2**31;
        this.a = 1103515245;
        this.c = 12345;

        this.state = seed;
    }
    nextInt() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }
    nextFloat() {
        // returns in range [0,1]
        return this.nextInt() / (this.m - 1);
    }
    nextRange(start, end) {
        // returns in range [start, end): including start, excluding end
        // can't modulu nextInt because of weak randomness in lower bits
        var rangeSize = end - start;
        var randomUnder1 = this.nextInt() / this.m;
        return start + Math.floor(randomUnder1 * rangeSize);
    }
    choice(array) {
        return array[this.nextRange(0, array.length)];
    }
}

class Game {
    constructor(words) {
        this.words = words;
        this.ctx = document.getElementById("game").getContext("2d");
        this.canvw = 400;
        this.buttons = [];
        this.color0 = "#000000";
        this.color1 = "#FFFFFF";
        this.color2 = "#555555";
        this.color3 = "#F1DD00";
        this.color4 = "#900000";
        this.kbletters = [
            ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"],
            ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"],
            ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю"],
        ];
        this.start();
    }

    cleargame() {
        $("#footer").text("");
        this.is_game_won = false;
        this.numwordsremain = this.words.length;
        this.curline = "";
        this.lines = [];
        this.is_game_over = false;
        this.is_incorrect_word = false
        this.kb_state = new Map();
        for (const line of this.kbletters) {
            for (const ch of line) {
                this.kb_state.set(ch, 0);
            }
        }
    }

    newgame(start_word_idx = -1) {
        console.log("New Game");
        this.cleargame();
        this.game_i = 1;
        this.randid = Math.floor(Math.random() * 10000);
        if (start_word_idx == -1) {
            start_word_idx = Math.floor(Math.random() * this.words.length);
        }
        this.start_word_idx = start_word_idx;
        this.rng = new RNG(this.start_word_idx);
        this.guessed_word = this.words[this.start_word_idx];
        this.change_url(true);
        this.refreshhtml();
        this.refresh();
    }

    nextgame() {
        this.game_i++;
        console.log("Next Game " + this.game_i);
        this.cleargame();
        this.guessed_word = this.rng.choice(this.words);
        this.change_url(true);
        this.refreshhtml();
        this.refresh();
    }

    manualgame() {
        if (this.lines.length == 0 && this.curline.length == 5) {
            var word_idx = this.words.findIndex((x) => x == this.curline);
            if (word_idx >= 0) {
                console.log("Manual Game");
                this.newgame(word_idx);
                return;
            }
        }
        alert("Введите одно правильное слово!");
    }

    start() {
        // Попробовать загрузить игру из URL, иначе newgame()
        this.cleargame();
        if (this.loadgame()) {
            console.log("Game loaded from query string");
            this.refreshhtml();
            this.refresh();
        } else {
            this.newgame();
        }
    }

    refreshhtml() {
        $("#gamei").text("N = " + this.game_i);
        $("#footer2").text("Осталось слов: " + this.numwordsremain);
        var numwins = Cookies.get("word5numwins");
        if (!numwins) numwins = 0;
        $("#footer3").text("Угадано слов: " + numwins);
        Cookies.set('name', 'value')
    }

    rounded_rect(x, y, w, h, r, fillStyle=0) {
        // Скругленный прямоугольник
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
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
            fillRect = this.color2;
            fillText = this.color1;
        } else if (state == 1) {
            fillRect = this.color1;
            fillText = this.color0;
        } else if (state == 2) {
            fillRect = this.color3;
            fillText = this.color0;
        } else {
            fillRect = 0;
            fillText = this.color1;
        }
        if (is_incorrect) {
            fillText = this.color4;
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
        const yoffset = 1;
        const padx = (this.canvw - letw*5 - xoffset*2)/4;
        const pady = padx*0.8;
        const rrad = padx;

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.color3;
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
                this.draw_cell(xoffset+i*(padx+letw), yoffset+j*(pady+leth), letw, leth, rrad, text, state, is_incorrect);
            }
        }
    }

    draw_kb_button_letter(x, y, w, h, r, text) {
        const fontSize = w * 0.8;
        const state = this.kb_state.get(text);
        if (state == 1) {
            this.rounded_rect(x, y, w, h, r, this.color2);
            this.ctx.fillStyle = this.color1;
        } else if (state == 2) {
            this.rounded_rect(x, y, w, h, r, this.color1);
            this.ctx.fillStyle = this.color0;
        } else if (state == 3) {
            this.rounded_rect(x, y, w, h, r, this.color3);
            this.ctx.fillStyle = this.color0;
        } else  {
            this.rounded_rect(x, y, w, h, r);
            this.ctx.fillStyle = this.color1;
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
            fillStyle = this.color3;
            strokeStyle = this.color0;
        } else {
            fillStyle = this.color2;
            strokeStyle = this.color1;
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
            fillStyle = this.color1;
            strokeStyle = this.color0;
        } else {
            fillStyle = this.color2;
            strokeStyle = this.color1;
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
        const letw = this.canvw * 0.07;
        const leth = this.canvw * 0.1075;
        const sbutw = letw * 1.5;
        const sbuth = leth;
        const padx = letw * 0.1;
        const rrad = this.canvw * 0.015;
        let letters = this.kbletters;

        this.buttons = [];
        this.ctx.strokeStyle = this.color2;
        for (let j = 0; j < 3; j++) {
            let letn = letters[j].length;
            let xoffset = (this.canvw - letw * letn - padx * (letn-1)) / 2;
            let yoffset = this.canvw * 1.10 + leth * 1.5 * j;
            for (let i = 0; i < letn; i++) {
                this.ctx.lineWidth = 1;
                let x = xoffset+i*(padx+letw);
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
                var x = xoffset - sbutw - padx;
                var y = yoffset;
                var w = sbutw;
                var h = sbuth;
                this.draw_kb_button_ok(x, y, w, h, rrad, (this.curline.length == 5));
                this.buttons.push({x1: x, y1: y, x2: x+w, y2: y+h, code: "OK"});
                // Button Backspace
                x = xoffset + (letw + padx) * letn;
                this.draw_kb_button_back(x, y, w, h, rrad, (this.curline.length != 0));
                this.buttons.push({x1: x, y1: y, x2: x+w, y2: y+h, code: "BACK"});
            }
        }
    }

    refresh() {
        this.ctx.reset();
        this.draw_game_field();
        this.draw_keyboard();
    }

    onclick(event) {
        var elem = document.getElementById('game'),
            elemLeft = elem.offsetLeft + elem.clientLeft,
            elemTop = elem.offsetTop + elem.clientTop;

        var x = event.pageX - elemLeft,
            y = event.pageY - elemTop;
        if (this.is_game_over) {
            return;
        }
        for (const btn of this.buttons) {
            if (x >= btn.x1 && x <= btn.x2 && y >= btn.y1 && y <= btn.y2) {
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

    calc_result(word, guessed_word) {
        let result = [0, 0, 0, 0, 0];
        let used = [0, 0, 0, 0, 0];
        for (let i = 0; i < 5; i++) {
            if (word[i] == guessed_word[i]) {
                result[i] = 2;
                used[i] = 1;
            }
        }
        for (let i = 0; i < 5; i++) {
            if (result[i]) {
                continue;
            }
            for (let j = 0; j < 5; j++) {
                if (used[j] != 0) {
                    continue;
                }
                if (word[i] == guessed_word[j]) {
                    result[i] = 1;
                    used[j] = 1;
                }
            }
        }
        return result;
    }

    add_line(word) {
        let result = this.calc_result(word, this.guessed_word);
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
        // Посчитать оставшиеся слова
        var numremain = 0;
        for (let word of this.words) {
            let ok = true;
            for (let line of this.lines) {
                if (line.result.toString() !== this.calc_result(line.word, word).toString()) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                numremain++;
            }
        }
        this.numwordsremain = numremain;

        if (word == this.guessed_word) {
            $("#footer").text("Вы угадали слово!");
            this.is_game_over = true;
            this.is_game_won = true;
        } else if (this.lines.length == 6) {
            this.is_game_over = true;
            $("#footer").text("Вы не угадали слово " + this.guessed_word);
        }
    }

    check() {
        if (this.words.includes(this.curline)) {
            this.add_line(this.curline);
            if (this.is_game_won) {
                var numwins = parseInt(Cookies.get("word5numwins"));
                if (!numwins) numwins = 0;
                numwins++;
                Cookies.set("word5numwins", numwins);
            }
            this.change_url();
            this.refreshhtml();
        } else {
            this.is_incorrect_word = true;
        }
    }

    change_url(save_to_history=false) {
        var qu = $.query.parseNew(window.location.search);
        var g = [
            this.start_word_idx,
            this.randid];
        var p = [];
        for (const y of this.lines) {
            p.push(this.words.findIndex((x) => x == y.word))
        }
        var newUrl = qu.set("g", btoa(JSON.stringify(g)));
        newUrl.SET("i", this.game_i);
        if (p.length != 0) {
            newUrl.SET("p", btoa(JSON.stringify(p)));
        } else {
            newUrl.REMOVE("p");
        }
        if (save_to_history) {
            window.history.pushState('page2', "Title", newUrl.toString());
        } else {
            window.history.replaceState('page2', "Title", newUrl.toString());
        }
    }

    loadgame() {
        // Загрузить состояние игры из параметров URL
        var qu = $.query.parseNew(window.location.search);
        var ga = qu.get("g");
        if (ga) {
            var g = JSON.parse(atob(ga));
            var ia = qu.get("i");

            this.start_word_idx = g[0];
            this.randid = g[1];

            this.game_i = 1;
            if (ia) {
                var i = parseInt(ia);
                if (!isNaN(i) && i > 1) {
                    this.game_i = i;
                }
            }
            this.rng = new RNG(this.start_word_idx);
            if (this.game_i == 1) {
                this.guessed_word = this.words[this.start_word_idx];
            } else {
                for (let i = this.game_i; i > 1; i--) {
                    this.guessed_word = this.rng.choice(this.words);
                }
            }

            var pa = qu.get("p");
            if (pa) {
                var p = JSON.parse(atob(pa));
                for (const word_idx of p ) {
                    this.add_line(this.words[word_idx]);
                }
            }
            return true;
        } else {
            return false;
        }
    }
}

function onload() {
    const canvas = document.getElementById("game");
    if (canvas.getContext) {
        window.g = new Game(words);
        canvas.addEventListener("click", function(event) {
            window.g.onclick(event);
        }, false);
        window.onpopstate = function(e) {
            window.g.start();
        };
        showrem_onchange();
    }
}

function newgame() {
    window.g.newgame();
}

function nextgame() {
    window.g.nextgame();
}

function showrem_onchange() {
    if ($("#showrem").prop("checked")) {
        $("#footer2").show();
    } else {
        $("#footer2").hide();
    }
}

function manualgame() {
    window.g.manualgame();
}
