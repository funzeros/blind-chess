(function (global) {
  AppDom.$define(
    class ChessPieces extends AppDom {
      render() {
        this.oCell = div(null, {
          class: `chess-pieces__cell ${DICT.PIECES_STATUS.DISABLED}`,
        });
        this.$appendChild(this.oCell);
        this.oStyle = style();
        this.$appendChild(this.oStyle);
        this.oStyle.textContent = `
        .chess-pieces__cell{
            cursor: pointer;
            border-radius:50%;
            overflow:hidden;
            height:100%;
            width:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:36px;
            box-shadow:0 0 4px 1px #000;
            transform:rotateY(180deg);
            transition:transform 300ms;
        }
        .black{
            color:#000;
        }
        .red{
            color:#f33;
        }
        .chess-pieces__cell:hover{
            background-color:#ffff6644;
        }
        .chess-pieces__cell::before{
            content:attr(data-name);
            opacity:0;
            transition:opacity 1ms 150ms;
        }
        .${DICT.PIECES_STATUS.ACTIVED}{
            transform:rotateY(0);
            background-color:#fffff6;
            box-shadow:0 0 4px 1px #000,0 0 8px #ddd inset;

        }
        .${DICT.PIECES_STATUS.ACTIVED}::before{
            opacity:1;
        }
        .${DICT.PIECES_STATUS.DISABLED}{
            background-color:#eee;
        }
        .${DICT.PIECES_STATUS.SELECTED}{
            // transform:scale(1.1);
            animation:scale 1s ease-in-out infinite;
        }
        @keyframes scale {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
            }
        }
        .die{
            animation:die 200ms ease-in-out forwards;

        }
        @keyframes die {
            0% {
                opacity:1;
                transform: scale(1);
            }
            100% {
                transform: scale(1.5);
                opacity:0;
            }
        }
        `;
        const onClick = this.onClick.bind(this);
        this.oCell.addEventListener("click", onClick);
        this.addEventListener("transitionstart", () => {
          this.style.zIndex = 9999;
        });
        this.addEventListener("transitionend", async () => {
          await sleep(200);
          this.style.zIndex = 1;
        });
      }
      data = {};
      setData(data) {
        this.data = data;
        this.asyncTransform();
        this.dataset.x = data.x;
        this.dataset.y = data.y;
      }
      get isSelected() {
        return this.data.status === DICT.PIECES_STATUS.SELECTED;
      }
      get isDisabled() {
        return this.data.status === DICT.PIECES_STATUS.DISABLED;
      }
      get isActived() {
        return this.data.status === DICT.PIECES_STATUS.ACTIVED;
      }
      get isMyTurn() {
        return !!this.$store.turn;
      }
      get oBoard() {
        return this.data.board;
      }
      get oParent() {
        return this.data.parent;
      }
      get sourceCell() {
        return this.$store.selectedPiece;
      }
      toggleTurn() {
        this.oParent.toggleTurn();
      }
      endDoing(toggle) {
        this.$store.doing = false;
        toggle && this.toggleTurn();
      }
      toast(text) {
        this.oParent.toast(text);
      }
      startDoing() {
        this.$store.doing = true;
        if (this.isMyTurn && !this.$store.myRole) {
          this.$store.myRole = this.data.role;
          this.send({
            type: "choose-role",
            role: this.$store.myRole,
          });
        }
      }
      async onClick(e) {
        const isMyOpt = !!e;
        if (isMyOpt && !this.isMyTurn) return;
        if (isMyOpt) {
          this.send({
            type: "pieces-click",
            data: { x: this.data.x, y: this.data.y, key: this.data.key },
            selected: this.sourceCell && {
              x: this.sourceCell.data.x,
              y: this.sourceCell.data.y,
              key: this.sourceCell.data.key,
            },
          });
        }
        if (isMyOpt && this.$store.doing) return;
        isMyOpt && this.startDoing();
        if (this.isSelected) {
          this.exitSelected();
          return this.endDoing();
        }
        let useToogle = false;
        if (this.$store.selectedPiece) {
          const sourceCell = this.$store.selectedPiece;
          const offset =
            Math.abs(this.data.x - sourceCell.data.x) +
            Math.abs(this.data.y - sourceCell.data.y);
          if (offset !== 1) return this.endDoing();
          if (this.isDisabled) {
            useToogle = true;
            this.exitDisabled();
            this.enterActived();
            await sleep(300);
          }
          if (this.isRoleEqual(this.data, sourceCell.data)) {
            sourceCell.exitSelected();
            return this.endDoing(useToogle);
          }
          useToogle = true;
          sourceCell.move(this.data);
          await sleep(300);
          if (this.isLevelSuppre(this.data, sourceCell.data)) {
            sourceCell.die();
          } else {
            this.die();
          }
          return this.endDoing(useToogle);
        }
        if (this.isDisabled) {
          this.exitDisabled();
          this.enterActived();
          return this.endDoing(true);
        }
        if (this.isActived) {
          if (isMyOpt) {
            if (this.data.role !== this.$store.myRole) return this.endDoing();
          } else {
            if (this.data.role === this.$store.myRole) return this.endDoing();
          }
          this.enterSelected();
          return this.endDoing();
        }
        return this.endDoing();
      }
      isRoleEqual(target, source) {
        return source.role === target.role;
      }
      isLevelSuppre(target, source) {
        if (target.level === 0 && source.level === 6) return true;
        if (source.level === 0 && target.level === 6) return false;
        return target.level > source.level;
      }
      asyncTransform() {
        const { x, y } = this.data;
        this.style.transform = `translate(calc(${x} * var(--cell-size)),calc(${y} * var(--cell-size))`;
      }
      move({ x, y }) {
        this.data.x = x;
        this.data.y = y;
        this.asyncTransform();
        this.exitSelected();
      }
      moveToEmpty(e, to) {
        const isMyOpt = !!e;
        if (isMyOpt) {
          this.send({
            type: "move-to-empty",
            data: { x: to.x, y: to.y },
            selected: this.sourceCell && {
              x: this.sourceCell.data.x,
              y: this.sourceCell.data.y,
              key: this.sourceCell.data.key,
            },
          });
        }
        if (isMyOpt) {
          if (!this.isMyTurn) return;
          if (this.$store.doing) return;
        }
        this.startDoing();
        const x = Number(to.x);
        const y = Number(to.y);
        const offset = Math.abs(this.data.x - x) + Math.abs(this.data.y - y);
        if (offset !== 1) return this.endDoing();
        this.move({ x: Number(to.x), y: Number(to.y) });
        return this.endDoing(true);
      }
      setStoreSelectedPiece(item) {
        this.$store.selectedPiece = item;
      }
      clearStoreSelectedPiece() {
        this.$store.selectedPiece = null;
      }
      exitSelected() {
        this.data.status = DICT.PIECES_STATUS.ACTIVED;
        this.clearStoreSelectedPiece();
        this.oCell.classList.remove(DICT.PIECES_STATUS.SELECTED);
        this.oBoard.classList.remove(DICT.PIECES_STATUS.SELECTED);
      }
      enterSelected() {
        this.data.status = DICT.PIECES_STATUS.SELECTED;
        this.oCell.classList.add(DICT.PIECES_STATUS.SELECTED);
        this.setStoreSelectedPiece(this);
        this.oBoard.classList.add(DICT.PIECES_STATUS.SELECTED);
      }
      exitDisabled() {
        this.oCell.classList.remove(DICT.PIECES_STATUS.DISABLED);
      }
      enterActived() {
        this.data.status = DICT.PIECES_STATUS.ACTIVED;
        this.oCell.dataset.role = this.data.role;
        this.oCell.dataset.name = this.data.name;
        this.oCell.classList.add(this.data.role, DICT.PIECES_STATUS.ACTIVED);
      }
      exitActived() {
        this.oCell.classList.remove(DICT.PIECES_STATUS.ACTIVED);
      }
      async die() {
        this.oCell.classList.add("die");
        await sleep(200);
        this.oParent.remove(this);
        this.oCell.classList.remove("die");
        this.oParent.validResult();
      }
    }
  );
})(this);
