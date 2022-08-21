(function (global) {
  AppDom.$define(
    class ChessHome extends AppDom {
      render() {
        this.initPeer();
        this.oCover = ChessCover();
        this.$appendChild(this.oCover);
        this.oBoard = ChessBoard();
        this.$appendChild(this.oBoard);
        this.style = `
        width:100vw;
        height:100vh;
        overflow:hidden;
        display:flex;
        flex-direction:column;
        justify-content:center;
        align-items:center;
        `;
        this.$on("start-game", ({ seed }, t) => {
          this.$store.seed = seed;
          this.startGame(t);
        });
        this.$on("exit-game", () => {
          this.exitGame();
        });
        this.$on("close", () => {
          this.exitGame();
          alert("已与对方断开连接");
        });
      }
      startGame(t) {
        this.oCover.hidden();
        this.oBoard.start(t);
      }
      exitGame(t) {
        this.oBoard.hidden(t);
        this.oCover.show();
        this.peerConn && this.peerConn.close();
        this.peerConn = null;
      }
      initPeer() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert("当前浏览器不支持webrtc，无法进行联机对战!");
        }
        this.peer.on("connection", (conn) => {
          if (this.peerConn) {
            conn.send(JSON.stringify({ type: "busy" }));
            conn.close();
            return;
          }
          this.peerConn = conn;
        });
      }
    }
  );
})(this);
