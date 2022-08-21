(function (global) {
  AppDom.$define(
    class ChessBoard extends AppDom {
      async render() {
        this.style = `
        display:none;
        `;
        this.initPanel();
        this.initBoard();
        this.initFooter();
      }
      hidden() {
        this.style = `
        display:none;
        `;
        this.oChessFrame.innerHTML = "";
      }
      start(t) {
        this.style = `
        width:100%;
        height:100%;
        overflow:hidden;
        display:flex;
        flex-direction:column;
        justify-content:space-between;
        align-items:center;
        `;
        this.random = useRandom(this.$store.seed);
        this.chessPieces = this.createChessPieces();
        this.chessPieces.forEach((oCell) => {
          this.oChessFrame.appendChild(oCell);
        });
        this.toast("正在决定谁先手...");
        const turn = this.random() < 0.5 ? 1 : 0;
        this.$store.turn = t ? turn : 1 - turn;
        this.toggleTurn();
      }
      toggleTurn() {
        this.$store.turn = 1 - this.$store.turn;
        this.toast(
          this.$store.turn
            ? `我方回合（${
                this.$store.myRole ? DICT.ZH[this.$store.myRole] : "到你"
              }出手)`
            : "对方回合（请等待）"
        );
      }
      toast(text = "") {
        this.oPanel.innerText = text;
      }
      initPanel() {
        this.oPanel = section(null, { class: "panel" });
        this.$appendChild(this.oPanel);
        this.panelStyle = style();
        this.$appendChild(this.panelStyle);
        this.panelStyle.textContent = `
        .panel{
          width:100%;
          height:40px;
          line-height:40px;
          border-bottom:1px solid #000;
          text-align:center;
        }
        `;
      }
      initBoard() {
        this.Y_SIZE = 4;
        this.X_SIZE = 8;
        this.TOTAL_SIZE = this.Y_SIZE * this.X_SIZE;
        this.CELL_SIZE = "100px";
        this.oBoard = main(null, { class: "board" });
        this.oBoardFrame = section(null, { class: "board-frame" });
        this.oChessFrame = section(null, { class: "chess-frame" });
        this.oBoard.appendChild(this.oBoardFrame);
        this.oBoard.appendChild(this.oChessFrame);
        this.$appendChild(this.oBoard);

        this.boardStyle = style();
        this.$appendChild(this.boardStyle);
        this.boardStyle.textContent = `
        .board{
          --cell-size:${this.CELL_SIZE};
          width:calc(var(--cell-size) * ${this.X_SIZE});
          height:calc(var(--cell-size) * ${this.Y_SIZE});
          position:relative;
        }
        .board-frame,.chess-frame{
          position:absolute;
          top:0;
          left:0;
          width:100%;
          height:100%;
          display:flex;
          flex-wrap:wrap;
          pointer-events: none;
        }
        .board-cell,chess-pieces{
          width:var(--cell-size);
          height:var(--cell-size);
          box-sizing:border-box;
        }
        .board-cell{
          border:0 dashed #000;
          border-left-width:1px;
          border-top-width:1px;
          pointer-events: auto;
        }
        .board-cell:nth-of-type(n+${(this.Y_SIZE - 1) * this.X_SIZE + 1}){
          border-bottom-width:1px;
        }
        .board-cell:nth-of-type(${this.X_SIZE}n){
          border-right-width:1px;
        }
        chess-pieces{
          padding:10px;
          position:absolute;
          top:0;
          left:0;
          will-change: transform;
          transition:transform 300ms ease-in-out;
          z-index:1;
          pointer-events: auto;
        }
        .board.${DICT.PIECES_STATUS.SELECTED} .board-cell{
          cursor: pointer;
        }
        .board.${DICT.PIECES_STATUS.SELECTED} .board-cell:hover{
          box-shadow: 0 0 calc(var(--cell-size) / 4) #ff6 inset;
        }
        `;
        this.boardCellData = this.createCells();
        this.boardCellData.forEach((oCell) => {
          this.oBoardFrame.appendChild(oCell);
        });
        this.$onUnmounted(() => {
          this.$store.selectedPiece = null;
        });
        this.$on("pieces-click", ({ data, selected }) => {
          if (selected && !this.$store.selectedPiece) {
            this.setSelected(selected);
          }
          const item = this.chessPieces.find(({ data: { key } }) => {
            return key === data.key;
          });
          item && item.onClick();
        });
        this.$on("move-to-empty", ({ data, selected }) => {
          if (selected && !this.$store.selectedPiece) {
            this.setSelected(selected);
          }
          this.$store.selectedPiece &&
            this.$store.selectedPiece.moveToEmpty(null, data);
        });
        this.$on("choose-role", ({ role }) => {
          this.$store.myRole = role === "red" ? "black" : "red";
        });
      }
      initFooter() {
        this.oFooter = section(
          `<pre>
        玩法说明：
        1.先手翻开决定色方。
        2.每次可移动棋子一步或翻开一枚背面棋子。
        3.以 帅/将-->士/仕-->相/象-->车/車-->马-->炮-->兵/卒-->帅/将 规则吃碰。
        </pre>`,
          { class: "footer" }
        );
        this.$appendChild(this.oFooter);
        this.panelStyle = style();
        this.$appendChild(this.panelStyle);
        this.panelStyle.textContent = `
        .footer{
          width:100%;
          height:40px;
          line-height:40px;
          // border-top:1px solid #000;
        }
        .footer pre{
          position:fixed;
          bottom:0;
          left:0;
          pointer-events:none;
          font-size:12px;
          color:#666;
          margin:0;
        }
        `;
      }
      setSelected(data) {
        this.$store.selectedPiece = this.chessPieces.find(
          ({ data: { key } }) => {
            return key === data.key;
          }
        );
      }
      remove(oCell) {
        this.oChessFrame.removeChild(oCell);
        global.chessPieces = this.chessPieces = this.chessPieces.filter(
          ({ data: { key } }) => {
            return !(key === oCell.data.key);
          }
        );
      }
      createCells() {
        return Array.from({ length: this.TOTAL_SIZE }, (_, i) => {
          const oDiv = div(null, {
            class: "board-cell",
            "data-x": i % this.X_SIZE,
            "data-y": ~~(i / this.X_SIZE),
          });
          oDiv.addEventListener("click", (e) => {
            this.$store.selectedPiece &&
              this.$store.selectedPiece.moveToEmpty(e, oDiv.dataset);
          });
          return oDiv;
        });
      }
      createChessPieces() {
        const pieces = [...CHESS_PIECES.black, ...CHESS_PIECES.red].sort(() =>
          this.random() < 0.5 ? 1 : -1
        );
        return pieces.map(({ name, level, role }, i) => {
          const oDiv = ChessPieces();
          oDiv.setData({
            role,
            name,
            level,
            x: i % this.X_SIZE,
            y: ~~(i / this.X_SIZE),
            status: DICT.PIECES_STATUS.DISABLED,
            board: this.oBoard,
            parent: this,
            key: this.random().toString(16),
          });
          return oDiv;
        });
      }
      validResult() {
        const redCount = this.chessPieces.filter(
          ({ data }) => data.role === "red"
        );
        const blackCount = this.chessPieces.filter(
          ({ data }) => data.role === "black"
        );
        if (redCount.length === 0) {
          alert(this.$store.myRole === "red" ? "你输了" : "你赢了");
          return this.exitGame();
        }
        if (blackCount.length === 0) {
          alert(this.$store.myRole === "red" ? "你赢了" : "你输了");
          return this.exitGame();
        }
      }
      exitGame() {
        this.$emit("exit-game");
      }
    }
  );
})(this);
